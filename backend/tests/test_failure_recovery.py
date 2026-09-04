"""T13 — Controlled failure + recovery (bounded, no infinite loop)."""
import pytest
from app.core.sub_agent import SubAgentResult, SubAgentRole, ResultStatus
from app.core.task import TaskStatus


@pytest.mark.asyncio
async def test_sub_agent_failure_leads_to_task_failed_bounded(runtime):
    original = runtime.sub_agent_manager.run_sub_agent

    async def fail(*a, **k):
        return SubAgentResult(role=SubAgentRole.RESEARCH, status=ResultStatus.FAILURE, output={}, rationale="boom", error={"code": "x"})

    runtime.sub_agent_manager.run_sub_agent = fail
    try:
        task = await runtime.submit_instruction("Research something", "conv-f", "u-f")
        task = await runtime.run_task(task)
        assert task.status == TaskStatus.FAILED
    finally:
        runtime.sub_agent_manager.run_sub_agent = original


@pytest.mark.asyncio
async def test_verifier_failure_recovers_to_failed(runtime):
    from app.verification.verifier import VerificationResult

    original = runtime.orchestrator._verifier.verify_sub_agent

    # Force every verification-point check to fail, exercising the verify->fix path.
    # verify_sub_agent is synchronous, so the replacement must be too.
    def bad_verify(*a, **k):
        return VerificationResult(False, "check", ["forced verification failure"], 1.0)

    runtime.orchestrator._verifier.verify_sub_agent = bad_verify
    try:
        task = await runtime.submit_instruction("Research oceans", "conv-vf", "u-vf")
        task.plan.verification_points = [s.id for s in task.plan.steps]
        task = await runtime.run_task(task)
        assert task.status == TaskStatus.FAILED
    finally:
        runtime.orchestrator._verifier.verify_sub_agent = original


@pytest.mark.asyncio
async def test_gateway_exhaustion_reaches_terminal_state(runtime):
    from app.exceptions import ProviderError
    async def boom(*a, **k):
        raise ProviderError("all down", retryable=False)

    runtime.gateway.complete = boom
    task = await runtime.submit_instruction("Research x", "conv-gw", "u-gw")
    task = await runtime.run_task(task)
    # Graceful degradation: a gateway outage must not hang or loop forever.
    # The task reaches a terminal state (FAILED if it could not recover, or COMPLETED
    # with degraded output) — never left executing/planning.
    assert task.status in (TaskStatus.FAILED, TaskStatus.COMPLETED)
