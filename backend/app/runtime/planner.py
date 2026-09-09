"""Planner: decompose intent into a Plan DAG (implementation/07-task-system.md).

Heuristic, deterministic decomposition. Each TaskType maps to a small ordered set of steps.
Dependencies form a chain (valid DAG). Parallel strategy derived later by Orchestrator.
"""
from __future__ import annotations

from typing import Optional

from app.core.sub_agent import SubAgentRole
from app.core.task import (
    Dependency,
    DependencyKind,
    Plan,
    PlanStrategy,
    Step,
    TaskIntent,
    TaskType,
)

# type -> ordered (goal_template, role, tool_ids, is_verification_point)
_DECOMPOSITION: dict[TaskType, list[tuple[str, SubAgentRole, list[str], bool]]] = {
    TaskType.RESEARCH: [("Research the topic: {goal}", SubAgentRole.RESEARCH, ["web.fetch", "search.query", "browser.navigate"], True)],
    TaskType.ANALYSIS: [("Analyze inputs for: {goal}", SubAgentRole.ANALYSIS, ["files.read", "calculator.eval"], True)],
    TaskType.CODE: [("Implement code for: {goal}", SubAgentRole.CODING, ["code.run", "terminal.exec", "files.write"], True)],
    TaskType.WRITE: [("Write content for: {goal}", SubAgentRole.WRITING, ["files.write"], True)],
    TaskType.DEBUG: [("Diagnose failure for: {goal}", SubAgentRole.DEBUG, ["code.run", "terminal.exec", "files.read"], True)],
    TaskType.FIX: [("Fix defect for: {goal}", SubAgentRole.FIX, ["code.run", "terminal.exec", "files.write"], True)],
    TaskType.REVIEW: [("Review for: {goal}", SubAgentRole.REVIEW, ["files.read", "code.run"], True)],
    TaskType.TEST: [("Test for: {goal}", SubAgentRole.TESTING, ["code.run", "terminal.exec"], True)],
    TaskType.BROWSER: [("Automate browser for: {goal}", SubAgentRole.BROWSER, ["browser.navigate", "browser.act", "web.fetch"], True)],
    TaskType.FILE: [("File operation for: {goal}", SubAgentRole.FILE, ["files.read", "files.write", "files.list"], True)],
    TaskType.VERIFY: [("Verify for: {goal}", SubAgentRole.VERIFICATION, ["files.read", "code.run", "terminal.exec"], True)],
    TaskType.SECURITY: [("Security audit for: {goal}", SubAgentRole.SECURITY, ["files.read", "terminal.exec", "code.run"], True)],
    TaskType.MIXED: [
        ("Research: {goal}", SubAgentRole.RESEARCH, ["web.fetch", "search.query"], True),
        ("Analyze findings for: {goal}", SubAgentRole.ANALYSIS, ["calculator.eval", "files.read"], True),
        ("Produce output for: {goal}", SubAgentRole.WRITING, ["files.write"], True),
    ],
    TaskType.UNKNOWN: [("Understand and address: {goal}", SubAgentRole.ANALYSIS, ["files.read"], True)],
}


def _disabled_roles() -> set:
    try:
        from app.config import settings

        return {x.strip() for x in (settings.disabled_roles or "").split(",") if x.strip()}
    except Exception:  # noqa: BLE001
        return set()


def _remap(role: SubAgentRole) -> SubAgentRole:
    """User-disabled role -> nearest allowed alternative (live gating from UI)."""
    dis = _disabled_roles()
    if role.value not in dis:
        return role
    for alt in (SubAgentRole.ANALYSIS, SubAgentRole.WRITING, SubAgentRole.RESEARCH, SubAgentRole.PLANNING):
        if alt.value not in dis:
            return alt
    return role


class Planner:
    def __init__(self, gateway=None) -> None:
        # quality-engineering #4: optional LLM-driven decomposition
        self._gateway = gateway

    async def aplan(self, intent: TaskIntent) -> Plan:
        """LLM-driven decomposition with template fallback (never fails)."""
        if self._gateway is None:
            return self.plan(intent)
        try:
            from app.core.sub_agent import SubAgentRole
            from app.runtime.sub_agents.base import reason_via_llm, safe_json

            roles = [r.value for r in SubAgentRole if r.value not in _disabled_roles()]
            tool_whitelist = sorted(
                {t for spec in _DECOMPOSITION.values() for _, _, ts, _ in spec for t in ts}
            )
            raw = await reason_via_llm(
                self._gateway,
                "You are a task planner. Decompose the goal into 1-4 ordered steps.\n"
                f"Allowed roles: {roles}\nAllowed tools: {tool_whitelist}\n"
                f"GOAL: {intent.goal}\n"
                'Respond with strict JSON only: {"steps": [{"goal": "...", "role": "<role>", "tools": ["<tool>"]}]}.',
                params={"temperature": 0.2, "max_tokens": 1200},
                contract=False,
            )
            data = safe_json(raw)
            spec = data.get("steps") if isinstance(data, dict) else data
            if not isinstance(spec, list) or not (1 <= len(spec) <= 4):
                return self.plan(intent)
            steps: list[Step] = []
            edges: list[Dependency] = []
            prev_id: Optional[str] = None
            vpoints: list[str] = []
            for item in spec:
                if not isinstance(item, dict):
                    return self.plan(intent)
                role = str(item.get("role", "")).lower()
                if role not in roles:
                    return self.plan(intent)
                tools = [t for t in item.get("tools", []) if t in tool_whitelist][:4]
                goal = str(item.get("goal") or intent.goal)[:300]
                step = Step(goal=goal, assigned_agent=role, tool_ids=tools or ["files.read"])
                if prev_id is not None:
                    step.depends_on.append(prev_id)
                    edges.append(Dependency(from_step=prev_id, to_step=step.id, kind=DependencyKind.FEEDS))
                vpoints.append(step.id)
                steps.append(step)
                prev_id = step.id
            return Plan(
                steps=steps,
                edges=edges,
                strategy=PlanStrategy.SEQUENTIAL,
                verification_points=vpoints,
                created_by="agent",
                version=1,
            )
        except Exception:  # noqa: BLE001 - template fallback keeps planning bulletproof
            return self.plan(intent)

    def plan(self, intent: TaskIntent) -> Plan:
        ttype = intent.classification if intent.classification != TaskType.UNKNOWN else TaskType.MIXED
        spec = _DECOMPOSITION.get(ttype, _DECOMPOSITION[TaskType.MIXED])
        steps: list[Step] = []
        edges: list[Dependency] = []
        prev_id: Optional[str] = None
        vpoints: list[str] = []
        for i, (goal_tmpl, role, tool_ids, is_vp) in enumerate(spec):
            step = Step(
                goal=goal_tmpl.format(goal=intent.goal),
                assigned_agent=_remap(role).value,
                tool_ids=tool_ids,
            )
            if prev_id is not None:
                step.depends_on.append(prev_id)
                edges.append(Dependency(from_step=prev_id, to_step=step.id, kind=DependencyKind.FEEDS))
            if is_vp:
                vpoints.append(step.id)
            steps.append(step)
            prev_id = step.id
        strategy = PlanStrategy.PARALLEL if len(steps) > 1 and all(not s.depends_on for s in steps) else PlanStrategy.SEQUENTIAL
        return Plan(
            steps=steps,
            edges=edges,
            strategy=strategy,
            verification_points=vpoints,
            created_by="user" if intent.constraints else "agent",
            version=1,
        )
