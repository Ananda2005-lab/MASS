"""T3 — Full runtime end-to-end flow (fake LLM adapter)."""
import pytest
from app.core.task import TaskStatus


@pytest.mark.asyncio
async def test_instruction_to_completed(runtime):
    task = await runtime.submit_instruction("Research the impact of renewable energy", "conv-e2e", "u-e2e")
    assert task.status.value in ("planning", "created")
    task = await runtime.run_task(task)
    assert task.status == TaskStatus.COMPLETED, task.status.value
    assert all(s.status.value == "succeeded" for s in task.plan.steps)
    evs = await runtime.event_bus.replay(task.id)
    types = {e["type"] for e in evs}
    assert "task_completed" in types
    assert "step_completed" in types


@pytest.mark.asyncio
async def test_mixed_task_chain(runtime):
    task = await runtime.submit_instruction("Research dogs then write a report", "conv-mix", "u-mix")
    assert len(task.plan.steps) >= 1  # planner decomposes as available
    task = await runtime.run_task(task)
    assert task.status == TaskStatus.COMPLETED
