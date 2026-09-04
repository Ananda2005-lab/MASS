"""Verification + recovery methods (implementation/12-verification-recovery.md, decision 03).

Per-category verification: each category has a method. Verify before accept (Phase 1 §15).
Recovery ownership maps to Orchestrator (06.4 / 12.5).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from app.core.sub_agent import SubAgentResult
from app.core.task import Result, TaskType


@dataclass
class VerificationResult:
    passed: bool
    method: str
    findings: list[str]
    confidence: float = 1.0


class Verifier:
    def verify_result(self, result: Result, task_type: TaskType) -> VerificationResult:
        """Verify a core Result (post-execution). Rich per-category checks run earlier
        on the real SubAgentResult (in Executor); here we confirm the stored Result is
        success and carries a non-empty summary. We do NOT reconstruct a SubAgentResult
        (rationale is not persisted on the core Result)."""
        if result.status.value != "success":
            return VerificationResult(False, "status", [f"result status={result.status.value}"], 1.0)
        if not result.summary or not result.summary.strip():
            return VerificationResult(False, "summary", ["empty result summary"], 1.0)
        return VerificationResult(True, "result", [], 1.0)

    def verify_sub_agent(self, res: SubAgentResult, task_type: TaskType) -> VerificationResult:
        method = f"category:{task_type.value}"
        findings: list[str] = []
        ok = res.status.value == "success"
        if not ok:
            findings.append("sub-agent reported failure")
            return VerificationResult(False, method, findings, 1.0)
        out = res.output or {}
        # Category-specific checks (decision 03 table)
        if task_type == TaskType.CODE and "code" not in out:
            findings.append("code task missing 'code' output"); ok = False
        if task_type == TaskType.RESEARCH and "sources" not in out and "findings" not in out:
            findings.append("research missing sources/findings"); ok = False
        if task_type in (TaskType.WRITE, TaskType.ANALYSIS, TaskType.MIXED) and not any(
            k in out for k in ("text", "insights", "findings", "content")
        ):
            findings.append("no textual output produced"); ok = False
        if task_type == TaskType.FILE and "content" not in out and "path" not in out:
            findings.append("file task missing content/path"); ok = False
        if not res.rationale:
            findings.append("missing rationale (Phase 1 §8)"); ok = False
        return VerificationResult(ok, method, findings, 0.9 if ok else 1.0)

    def verify_step(self, task_type: TaskType, res: SubAgentResult) -> VerificationResult:
        return self.verify_sub_agent(res, task_type)
