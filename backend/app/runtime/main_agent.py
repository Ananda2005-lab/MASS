"""Main Agent: understand intent, normalize goal, classify, create Task (implementation/05.2, 07.1).

Does NOT guess locked decisions; if genuinely ambiguous it would pause (not needed for MVP).
"""
from __future__ import annotations

from app.core.sub_agent import SubAgentRole
from app.core.task import (
    Constraint,
    ConstraintKind,
    Task,
    TaskIntent,
    TaskStatus,
    TaskType,
)
from app.runtime.planner import Planner

_TYPE_KEYWORDS = {
    TaskType.RESEARCH: ["research", "find out", "investigate", "survey"],
    TaskType.CODE: ["code", "implement", "build", "develop", "program"],
    TaskType.WRITE: ["write", "draft", "compose", "article", "report"],
    TaskType.DEBUG: ["debug", "diagnose", "why is", "failing"],
    TaskType.FIX: ["fix", "repair", "resolve the bug", "correct"],
    TaskType.ANALYSIS: ["analyze", "analysis", "evaluate", "assess"],
    TaskType.REVIEW: ["review", "audit", "check"],
    TaskType.TEST: ["test", "verify with tests", "unit test"],
    TaskType.BROWSER: ["browse", "open the site", "scrape", "navigate"],
    TaskType.FILE: ["read file", "list files", "organize files", "file"],
    TaskType.SECURITY: ["security", "permission", "vulnerability", "secret"],
}


class MainAgent:
    def __init__(self, planner: Planner) -> None:
        self._planner = planner

    def classify(self, raw: str) -> TaskType:
        low = raw.lower()
        for ttype, kws in _TYPE_KEYWORDS.items():
            if any(k in low for k in kws):
                return ttype
        return TaskType.MIXED

    def _extract_constraints(self, raw: str) -> list[Constraint]:
        out: list[Constraint] = []
        low = raw.lower()
        if "use research agent" in low:
            out.append(Constraint(kind=ConstraintKind.SUB_AGENT, value=SubAgentRole.RESEARCH.value))
        if "use coding agent" in low:
            out.append(Constraint(kind=ConstraintKind.SUB_AGENT, value=SubAgentRole.CODING.value))
        # user may specify "avoid browser" etc. — captured as scope constraints.
        return out

    def create_task(self, raw: str, conversation_id: str, user_id: str, mode: str = "instruction") -> Task:
        goal = raw.strip()
        intent = TaskIntent(
            raw=raw,
            goal=goal,
            constraints=self._extract_constraints(raw),
            mode=mode,
            classification=self.classify(raw),
        )
        task = Task(
            conversation_id=conversation_id,
            user_id=user_id,
            intent=intent,
            plan=self._planner.plan(intent),
            status=TaskStatus.CREATED,
        )
        return task
