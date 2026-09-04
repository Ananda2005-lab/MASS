"""Repository pattern: typed access to persistent entities.

Spec: implementation/16.5. Runtime/state call repos; repos own SQL. No raw SQL in runtime.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import select

from app.core.task import Task, Step
from app.persistence.engine import session_scope
from app.persistence.models import (
    EventRow,
    MemoryItemRow,
    ResultRow,
    StepRow,
    TaskRow,
)
from app.persistence.models import _dumps, _loads


def _row_to_task(row: TaskRow) -> Task:
    return Task(
        id=row.id,
        conversation_id=row.conversation_id,
        user_id=row.user_id,
        intent=_loads(row.intent_json),
        plan=_loads(row.plan_json),
        status=row.status,
        current_step_id=row.current_step_id,
        created_at=row.created_at,
        updated_at=row.updated_at,
        final_result=_loads(row.final_result_json),
        metadata=_loads(row.metadata_json) or {},
    )


def _step_row_to_model(row: StepRow) -> Step:
    return Step(
        id=row.id,
        goal=row.goal,
        assigned_agent=row.assigned_agent,
        tool_ids=_loads(row.tool_ids_json) or [],
        input_refs=_loads(row.input_refs_json) or [],
        status=row.status,
        result=_loads(row.result_json),
        retry_count=row.retry_count,
        depends_on=_loads(row.depends_on_json) or [],
    )


class TaskRepo:
    async def save(self, task: Task) -> None:
        async with session_scope() as s:
            existing = await s.get(TaskRow, task.id)
            if existing:
                existing.intent_json = _dumps(task.intent.model_dump())
                existing.plan_json = _dumps(task.plan.model_dump())
                existing.status = task.status.value
                existing.current_step_id = task.current_step_id
                existing.final_result_json = _dumps(task.final_result.model_dump()) if task.final_result else None
                existing.metadata_json = _dumps(task.metadata)
                existing.updated_at = task.updated_at
            else:
                s.add(
                    TaskRow(
                        id=task.id,
                        conversation_id=task.conversation_id,
                        user_id=task.user_id,
                        intent_json=_dumps(task.intent.model_dump()),
                        plan_json=_dumps(task.plan.model_dump()),
                        status=task.status.value,
                        current_step_id=task.current_step_id,
                        final_result_json=_dumps(task.final_result.model_dump()) if task.final_result else None,
                        metadata_json=_dumps(task.metadata),
                    )
                )

    async def load(self, task_id: str) -> Optional[Task]:
        async with session_scope() as s:
            row = await s.get(TaskRow, task_id)
            return _row_to_task(row) if row else None


class StepRepo:
    async def save(self, task_id: str, step: Step) -> None:
        async with session_scope() as s:
            existing = await s.get(StepRow, step.id)
            if existing:
                existing.goal = step.goal
                existing.assigned_agent = step.assigned_agent
                existing.tool_ids_json = _dumps(step.tool_ids)
                existing.input_refs_json = _dumps([r.model_dump() for r in step.input_refs])
                existing.status = step.status.value
                existing.result_json = _dumps(step.result.model_dump()) if step.result else None
                existing.retry_count = step.retry_count
                existing.depends_on_json = _dumps(step.depends_on)
            else:
                s.add(
                    StepRow(
                        id=step.id,
                        task_id=task_id,
                        goal=step.goal,
                        assigned_agent=step.assigned_agent,
                        tool_ids_json=_dumps(step.tool_ids),
                        input_refs_json=_dumps([r.model_dump() for r in step.input_refs]),
                        status=step.status.value,
                        result_json=_dumps(step.result.model_dump()) if step.result else None,
                        retry_count=step.retry_count,
                        depends_on_json=_dumps(step.depends_on),
                    )
                )

    async def list_for_task(self, task_id: str) -> list[Step]:
        async with session_scope() as s:
            rows = (await s.execute(select(StepRow).where(StepRow.task_id == task_id))).scalars().all()
            return [_step_row_to_model(r) for r in rows]


class ResultRepo:
    async def save(self, result_row) -> None:
        async with session_scope() as s:
            s.add(result_row)


class EventRepo:
    async def append(self, event) -> None:
        async with session_scope() as s:
            s.add(
                EventRow(
                    id=event.id,
                    task_id=event.task_id,
                    step_id=event.step_id,
                    type=event.type.value,
                    actor=event.actor.value,
                    seq=event.seq,
                    payload_json=_dumps(event.payload),
                )
            )

    async def replay(self, task_id: str, since_seq: int = 0) -> list:
        async with session_scope() as s:
            rows = (
                await s.execute(
                    select(EventRow)
                    .where(EventRow.task_id == task_id, EventRow.seq > since_seq)
                    .order_by(EventRow.seq)
                )
            ).scalars().all()
            return [
                {
                    "id": r.id,
                    "task_id": r.task_id,
                    "step_id": r.step_id,
                    "type": r.type,
                    "actor": r.actor,
                    "timestamp": r.timestamp,
                    "seq": r.seq,
                    "payload": _loads(r.payload_json) or {},
                }
                for r in rows
            ]


class MemoryRepo:
    async def add(self, item) -> None:
        async with session_scope() as s:
            s.add(item)

    async def list_for_user(self, user_id: str, kind: Optional[str] = None) -> list:
        async with session_scope() as s:
            q = select(MemoryItemRow).where(MemoryItemRow.user_id == user_id)
            if kind:
                q = q.where(MemoryItemRow.kind == kind)
            rows = (await s.execute(q)).scalars().all()
            return [
                {"id": r.id, "kind": r.kind, "content": r.content, "importance": r.importance}
                for r in rows
            ]
