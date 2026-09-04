"""T9 — Task state transitions, event creation/ordering/replay (13-task-state-events)."""
import pytest
from app.core.task import Task, TaskIntent, TaskStatus
from app.core.event import Event, EventType, EventActor
from app.exceptions import TaskStateError
from app.state.task_state import TaskStateStore, VALID_TRANSITIONS


def _task():
    return Task(conversation_id="c", user_id="u", intent=TaskIntent(raw="r", goal="g"), plan=__import__("app.core.task", fromlist=["Plan"]).Plan())


@pytest.mark.asyncio
async def test_valid_transitions(runtime):
    t = _task()
    await runtime.state.save(t)
    await runtime.state.transition(t, TaskStatus.PLANNING)
    await runtime.state.transition(t, TaskStatus.EXECUTING)
    assert t.status == TaskStatus.EXECUTING


@pytest.mark.asyncio
async def test_invalid_transition_rejected(runtime):
    t = _task()
    await runtime.state.save(t)
    with pytest.raises(TaskStateError):
        await runtime.state.transition(t, TaskStatus.COMPLETED)  # CREATED -> COMPLETED invalid


@pytest.mark.asyncio
async def test_event_publish_increments_seq_and_replays(runtime):
    t = _task()
    await runtime.state.save(t)
    for i in range(3):
        await runtime.event_bus.publish(Event(type=EventType.INFO, task_id=t.id, payload={"i": i}))
    evs = await runtime.event_bus.replay(t.id)
    seqs = [e["seq"] for e in evs]
    assert seqs == [1, 2, 3]
    assert all(e["task_id"] == t.id for e in evs)
