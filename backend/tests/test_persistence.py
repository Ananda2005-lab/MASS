"""T12 — Persistence schemas/repos (local SQLite; PostgreSQL/Redis code paths env-blocked)."""
import pytest
from app.core.task import Task, TaskIntent, Plan, Step, Result, ResultStatus
from app.persistence.repos import TaskRepo, EventRepo
from app.core.event import Event, EventType, EventActor


@pytest.mark.asyncio
async def test_task_repo_roundtrip():
    repo = TaskRepo()
    t = Task(conversation_id="c", user_id="u", intent=TaskIntent(raw="r", goal="g"), plan=Plan())
    await repo.save(t)
    loaded = await repo.load(t.id)
    assert loaded is not None
    assert loaded.conversation_id == "c"
    assert loaded.intent.goal == "g"
    assert loaded.status.value == "created"


@pytest.mark.asyncio
async def test_step_repo_and_event_repo():
    step = Step(goal="g", depends_on=[])
    repo = TaskRepo()
    t = Task(conversation_id="c", user_id="u", intent=TaskIntent(raw="r", goal="g"), plan=Plan(steps=[step]))
    await repo.save(t)
    from app.persistence.repos import StepRepo
    srepo = StepRepo()
    await srepo.save(t.id, step)
    steps = await srepo.list_for_task(t.id)
    assert len(steps) == 1 and steps[0].goal == "g"


@pytest.mark.asyncio
async def test_event_repo_append_replay():
    erepo = EventRepo()
    # seq mirrors EventBus.publish semantics (>=1) so replay(since_seq=0) includes it
    e = Event(type=EventType.INFO, task_id="t1", actor=EventActor.SYSTEM, payload={"a": 1}, seq=1)
    await erepo.append(e)
    out = await erepo.replay("t1")
    assert len(out) == 1 and out[0]["payload"]["a"] == 1
