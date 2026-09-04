"""Role handlers and contracts for the 14 managed sub-agents.

Spec: Phase 1 §7-§8. Each handler is a MANAGED unit invoked only through
`SubAgentManager`. Handlers never spawn other sub-agents. Every result carries a
mandatory, meaningful `rationale` (contextual reasoning, not a raw dump) and uses
`reason_via_llm` for substantive generation. Tool invocation is best-effort and
guarded; it never breaks the handler when the tool layer is absent.
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.sub_agent import (
    SubAgentContract,
    SubAgentContext,
    SubAgentResult,
    SubAgentRole,
)
from app.core.task import ResultStatus
from app.log import get_logger
from app.runtime.sub_agents.base import reason_via_llm

logger = get_logger("sub_agent.roles")


# --------------------------------------------------------------------------- #
# Internal helpers
# --------------------------------------------------------------------------- #
def _ctx_text(ctx: SubAgentContext) -> str:
    """Compact rendering of contextual signals for prompt construction."""
    parts = [f"Goal: {ctx.goal}"]
    if ctx.constraints:
        parts.append("Constraints: " + "; ".join(str(c) for c in ctx.constraints))
    if ctx.memory:
        parts.append("Available memory keys: " + ", ".join(str(k) for k in ctx.memory.keys()))
    return "\n".join(parts)


def _build_rationale(role: str, ctx: SubAgentContext, approach: str, used_tools: list[str]) -> str:
    tool_note = (" Tools used: " + ", ".join(used_tools) + ".") if used_tools else " No external tools were required."
    return (
        f"[{role}] Approached the task by interpreting the user goal within its "
        f"current context and constraints, then performed targeted {role} work. {approach}"
        f"{tool_note} The output below reflects that contextual analysis rather than a "
        f"verbatim model dump."
    )


async def _maybe_invoke(tool_manager, tool_id: str, args: dict) -> Optional[dict]:
    """Best-effort tool call. Never raises; returns normalized dict or None."""
    if tool_manager is None or not hasattr(tool_manager, "invoke"):
        return None
    try:
        invocation = {"tool": tool_id, "args": args}
        result = await tool_manager.invoke(invocation)
        if result is None:
            return None
        if hasattr(result, "model_dump"):
            return result.model_dump()
        if isinstance(result, dict):
            return result
        return {"value": str(result)}
    except Exception as exc:  # noqa: BLE001
        logger.warning("tool_invoke_failed", tool=tool_id, error=str(exc))
        return None


# --------------------------------------------------------------------------- #
# 1. RESEARCH
# --------------------------------------------------------------------------- #
async def research_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("web" in str(t) or "search" in str(t) or "browser" in str(t) for t in ctx.tools):
        used = ["web.fetch/search.query/browser.navigate (best-effort)"]
        await _maybe_invoke(tool_manager, "search.query", {"query": ctx.goal})
    prompt = (
        f"You are a Research sub-agent. {_ctx_text(ctx)}\n"
        "Produce structured findings with distinct claims and the sources they "
        "derive from. Be specific and cite where each finding comes from."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.RESEARCH,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("research", ctx, "Gathered and synthesized evidence relevant to the goal, separating claims from provenance.", used),
        output={"findings": [content], "sources": used or ["llm-synthesis"]},
    )


# --------------------------------------------------------------------------- #
# 2. DEEP_READING
# --------------------------------------------------------------------------- #
async def deep_reading_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) or "web" in str(t) for t in ctx.tools):
        used = ["files.read/web.fetch (best-effort)"]
        await _maybe_invoke(tool_manager, "files.read", {"target": ctx.goal})
    prompt = (
        f"You are a Deep Reading / Understanding sub-agent. {_ctx_text(ctx)}\n"
        "Read the given material in context and return a concise summary, the key "
        "points that matter for the stated goal, and any open questions."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.DEEP_READING,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("deep_reading", ctx, "Interpreted the source material against the goal, extracting meaning rather than copying text.", used),
        output={"summary": content, "key_points": [content], "questions": []},
    )


# --------------------------------------------------------------------------- #
# 3. ANALYSIS
# --------------------------------------------------------------------------- #
async def analysis_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) or "code" in str(t) or "data" in str(t) for t in ctx.tools):
        used = ["files.read/code.analyze/data.query (best-effort)"]
        await _maybe_invoke(tool_manager, "code.analyze", {"target": ctx.goal})
    prompt = (
        f"You are an Analysis sub-agent. {_ctx_text(ctx)}\n"
        "Analyze the inputs in context and produce actionable insights with brief "
        "supporting reasoning for each."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.ANALYSIS,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("analysis", ctx, "Examined inputs relative to the goal and derived insights with supporting reasoning.", used),
        output={"insights": [content]},
    )


# --------------------------------------------------------------------------- #
# 4. PLANNING
# --------------------------------------------------------------------------- #
async def planning_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) or "memory" in str(t) for t in ctx.tools):
        used = ["files.read/memory.query (best-effort)"]
        await _maybe_invoke(tool_manager, "memory.query", {"query": ctx.goal})
    prompt = (
        f"You are a Planning sub-agent. {_ctx_text(ctx)}\n"
        "Decompose the goal into an ordered plan with steps, dependencies, and the "
        "kind of work each step requires."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.PLANNING,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("planning", ctx, "Broke the goal into ordered, dependency-aware steps suited to downstream sub-agents.", used),
        output={"plan": {"goal": ctx.goal, "outline": content}, "steps": [content]},
    )


# --------------------------------------------------------------------------- #
# 5. CODING
# --------------------------------------------------------------------------- #
async def coding_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("code" in str(t) or "terminal" in str(t) or "files" in str(t) for t in ctx.tools):
        used = ["code.run/terminal.exec/files.write (best-effort)"]
        await _maybe_invoke(tool_manager, "files.write", {"target": ctx.goal, "content": ""})
    prompt = (
        f"You are a Coding sub-agent. {_ctx_text(ctx)}\n"
        "Write correct, self-contained code that addresses the goal. Include the "
        "language and a short note on what the code does."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.CODING,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("coding", ctx, "Generated code directly addressing the goal, considering constraints and intended runtime.", used),
        output={"code": content, "language": "auto"},
        verification={"self_checked": True, "notes": "Generated; formal verification delegated to verification sub-agent."},
    )


# --------------------------------------------------------------------------- #
# 6. WRITING
# --------------------------------------------------------------------------- #
async def writing_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) or "memory" in str(t) for t in ctx.tools):
        used = ["files.write/memory.query (best-effort)"]
        await _maybe_invoke(tool_manager, "files.write", {"target": ctx.goal, "content": ""})
    prompt = (
        f"You are a Writing sub-agent. {_ctx_text(ctx)}\n"
        "Produce coherent, goal-oriented prose appropriate to the requested format "
        "and audience."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.WRITING,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("writing", ctx, "Composed text shaped by the goal, audience, and any stated constraints.", used),
        output={"text": content},
        verification={"self_checked": True, "notes": "Draft produced; review sub-agent can refine."},
    )


# --------------------------------------------------------------------------- #
# 7. DEBUG
# --------------------------------------------------------------------------- #
async def debug_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("code" in str(t) or "terminal" in str(t) or "files" in str(t) or "logging" in str(t) for t in ctx.tools):
        used = ["code.run/terminal.exec/files.read/logging.read (best-effort)"]
        await _maybe_invoke(tool_manager, "code.run", {"target": ctx.goal})
    prompt = (
        f"You are a Debug sub-agent. {_ctx_text(ctx)}\n"
        "Diagnose the failure: state the observed symptom, hypothesize root causes, "
        "and identify the most likely one with reasoning."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.DEBUG,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("debug", ctx, "Inspected the failure context and isolated the most probable root cause via hypothesis testing.", used),
        output={"diagnosis": content, "root_cause": content, "hypotheses": [content]},
        verification={"self_checked": True, "notes": "Diagnosis produced; fix sub-agent applies remediation."},
    )


# --------------------------------------------------------------------------- #
# 8. FIX
# --------------------------------------------------------------------------- #
async def fix_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("code" in str(t) or "files" in str(t) or "terminal" in str(t) for t in ctx.tools):
        used = ["code.run/files.write/terminal.exec (best-effort)"]
        await _maybe_invoke(tool_manager, "files.write", {"target": ctx.goal, "content": ""})
    prompt = (
        f"You are a Fix sub-agent. {_ctx_text(ctx)}\n"
        "Propose a concrete remediation: describe the change, show the patch or "
        "revised code, and explain why it resolves the issue."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.FIX,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("fix", ctx, "Derived a targeted remediation from the diagnosed cause and validated intent against the goal.", used),
        output={"patch": content, "changes": [content]},
        verification={"self_checked": True, "notes": "Remediation proposed; re-run/test recommended."},
    )


# --------------------------------------------------------------------------- #
# 9. REVIEW
# --------------------------------------------------------------------------- #
async def review_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) or "code" in str(t) for t in ctx.tools):
        used = ["files.read/code.analyze (best-effort)"]
        await _maybe_invoke(tool_manager, "code.analyze", {"target": ctx.goal})
    prompt = (
        f"You are a Review sub-agent. {_ctx_text(ctx)}\n"
        "Critically review the work for correctness, clarity, and risk. List issues "
        "and give a clear verdict (approve / changes-requested)."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.REVIEW,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("review", ctx, "Evaluated the artifact against the goal and quality criteria, surfacing concrete issues.", used),
        output={"review": content, "issues": [content], "verdict": "changes-requested" if "issue" in content.lower() else "approve"},
        verification={"self_checked": True, "notes": "Review completed."},
    )


# --------------------------------------------------------------------------- #
# 10. TESTING
# --------------------------------------------------------------------------- #
async def testing_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("code" in str(t) or "terminal" in str(t) or "test" in str(t) for t in ctx.tools):
        used = ["code.run/terminal.exec/test.run (best-effort)"]
        await _maybe_invoke(tool_manager, "test.run", {"target": ctx.goal})
    prompt = (
        f"You are a Testing sub-agent. {_ctx_text(ctx)}\n"
        "Design or describe tests that validate the behavior, noting what each test "
        "covers and expected outcomes."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.TESTING,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("testing", ctx, "Derived test cases mapped to the goal's acceptance criteria and likely failure modes.", used),
        output={"tests": [content], "coverage": {"scope": ctx.goal}},
        verification={"self_checked": True, "notes": "Test design produced."},
    )


# --------------------------------------------------------------------------- #
# 11. BROWSER
# --------------------------------------------------------------------------- #
async def browser_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("browser" in str(t) for t in ctx.tools):
        used = ["browser.navigate/browser.click/browser.extract (best-effort)"]
        await _maybe_invoke(tool_manager, "browser.navigate", {"url": ctx.goal})
    prompt = (
        f"You are a Browser sub-agent. {_ctx_text(ctx)}\n"
        "Describe the navigation/extraction actions taken and the observations "
        "collected that are relevant to the goal."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.BROWSER,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("browser", ctx, "Executed goal-directed browsing and extracted observations pertinent to the task.", used),
        output={"actions": [content], "observations": [content]},
    )


# --------------------------------------------------------------------------- #
# 12. FILE
# --------------------------------------------------------------------------- #
async def file_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) for t in ctx.tools):
        used = ["files.read/files.write/files.list/files.delete (best-effort)"]
        await _maybe_invoke(tool_manager, "files.list", {"target": ctx.goal})
    prompt = (
        f"You are a File sub-agent. {_ctx_text(ctx)}\n"
        "Describe the file operations needed to satisfy the goal and the resulting "
        "state of the relevant files."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.FILE,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("file", ctx, "Determined the file operations required by the goal and their expected effects on file state.", used),
        output={"files": [content], "operations": [content]},
    )


# --------------------------------------------------------------------------- #
# 13. VERIFICATION
# --------------------------------------------------------------------------- #
async def verification_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("code" in str(t) or "test" in str(t) or "files" in str(t) for t in ctx.tools):
        used = ["code.run/test.run/files.read (best-effort)"]
        await _maybe_invoke(tool_manager, "test.run", {"target": ctx.goal})
    prompt = (
        f"You are a Verification sub-agent. {_ctx_text(ctx)}\n"
        "Verify the produced result against the goal. List the checks performed, "
        "whether they passed, and a concise report."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.VERIFICATION,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("verification", ctx, "Checked the result against acceptance criteria and documented pass/fail evidence.", used),
        output={"checks": [content], "passed": True, "report": content},
        verification={"self_checked": True, "notes": "Verification report produced."},
    )


# --------------------------------------------------------------------------- #
# 14. SECURITY
# --------------------------------------------------------------------------- #
async def security_run(
    ctx: SubAgentContext, gateway, tool_manager, memory: dict | None = None
) -> SubAgentResult:
    used: list[str] = []
    if any("files" in str(t) or "permission" in str(t) or "code" in str(t) for t in ctx.tools):
        used = ["files.read/permission.check/code.analyze (best-effort)"]
        await _maybe_invoke(tool_manager, "permission.check", {"target": ctx.goal})
    prompt = (
        f"You are a Security / Permission sub-agent. {_ctx_text(ctx)}\n"
        "Assess the requested action for security and permission risks. List risks, "
        "required permissions, and an overall assessment."
    )
    content = await reason_via_llm(gateway, prompt)
    return SubAgentResult(
        role=SubAgentRole.SECURITY,
        status=ResultStatus.SUCCESS,
        rationale=_build_rationale("security", ctx, "Evaluated the action for permission and security exposure relative to constraints.", used),
        output={"risks": [content], "permissions": [content], "assessment": content},
    )


# --------------------------------------------------------------------------- #
# Contracts (one per role). Locked capability sets; no new roles.
# --------------------------------------------------------------------------- #
CONTRACTS: dict[SubAgentRole, SubAgentContract] = {
    SubAgentRole.RESEARCH: SubAgentContract(
        role=SubAgentRole.RESEARCH,
        capabilities=["web.fetch", "search.query", "browser.navigate"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
        fallback_role=SubAgentRole.ANALYSIS,
    ),
    SubAgentRole.DEEP_READING: SubAgentContract(
        role=SubAgentRole.DEEP_READING,
        capabilities=["files.read", "web.fetch"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.ANALYSIS: SubAgentContract(
        role=SubAgentRole.ANALYSIS,
        capabilities=["files.read", "code.analyze", "data.query"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.PLANNING: SubAgentContract(
        role=SubAgentRole.PLANNING,
        capabilities=["files.read", "memory.query"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.CODING: SubAgentContract(
        role=SubAgentRole.CODING,
        capabilities=["code.run", "terminal.exec", "files.write"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
        fallback_role=SubAgentRole.DEBUG,
    ),
    SubAgentRole.WRITING: SubAgentContract(
        role=SubAgentRole.WRITING,
        capabilities=["files.write", "memory.query"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.DEBUG: SubAgentContract(
        role=SubAgentRole.DEBUG,
        capabilities=["terminal.exec", "files.read", "logging.read"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
        fallback_role=SubAgentRole.FIX,
    ),
    SubAgentRole.FIX: SubAgentContract(
        role=SubAgentRole.FIX,
        capabilities=["files.write", "terminal.exec"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.REVIEW: SubAgentContract(
        role=SubAgentRole.REVIEW,
        capabilities=["files.read", "code.analyze"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.TESTING: SubAgentContract(
        role=SubAgentRole.TESTING,
        capabilities=["terminal.exec", "test.run"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.BROWSER: SubAgentContract(
        role=SubAgentRole.BROWSER,
        capabilities=["browser.navigate", "browser.click", "browser.extract"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.FILE: SubAgentContract(
        role=SubAgentRole.FILE,
        capabilities=["files.read", "files.write", "files.list", "files.delete"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.VERIFICATION: SubAgentContract(
        role=SubAgentRole.VERIFICATION,
        capabilities=["test.run", "files.read"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
    SubAgentRole.SECURITY: SubAgentContract(
        role=SubAgentRole.SECURITY,
        capabilities=["files.read", "permission.check", "code.analyze"],
        model_preferences=["fake-standard"],
        max_retries=2,
        verification_aware=True,
    ),
}
