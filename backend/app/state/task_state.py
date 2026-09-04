"""Task state store + state machine (implementation/13-task-state-events.md 13.1-13.3).

Durable Task state via TaskRepo; every mutation emits an Event through the bus.
State machine enforces valid transitions (no invalid jumps).
"""
from __future__ import annotations

from typing import Optional

from app.core.event import Event, EventActor, EventType
from app.core.task import Plan, Result, Task, TaskStatus
from app.exceptions import TaskStateError
from app.persistence.repos import TaskRepo

VALID_TRANSITIONS = {
    TaskStatus.CREATED: {TaskStatus.PLANNING, TaskStatus.PAUSED, TaskStatus.FAILED},
    TaskStatus.PLANNING: {TaskStatus.EXECUTING, TaskStatus.PAUSED, TaskStatus.FAILED},
    TaskStatus.EXECUTING: {TaskStatus.VERIFYING, TaskStatus.PAUSED, TaskStatus.FAILED},
    TaskStatus.VERIFYING: {TaskStatus.COMPLETED, TaskStatus.EXECUTING, TaskStatus.PAUSED, TaskStatus.FAILED},
    TaskStatus.PAUSED: {TaskStatus.EXECUTING, TaskStatus.PLANNING, TaskStatus.FAILED},
    TaskStatus.FAILED: set(),
    TaskStatus.COMPLETED: set(),
}


class TaskStateStore:
    def __init__(self, task_repo: TaskRepo, event_bus) -> None:
        self._repo = task_repo
        self._bus = event_bus

    async def save(self, task: Task) -> None:
        await self._repo.save(task)

    async def load(self, task_id: str) -> Optional[Task]:
        return await self._repo.load(task_id)

    async def transition(self, task: Task, new_status: TaskStatus, actor: EventActor = EventActor.SYSTEM) -> None:
        if new_status not in VALID_TRANSITIONS.get(task.status, set()):
            raise TaskStateError(
                f"Invalid transition {task.status.value} -> {new_status.value}"
            )
        old = task.status
        task.status = new_status
        await self._repo.save(task)
        await self._bus.publish(
            Event(
                type=EventType.INFO,
                task_id=task.id,
                actor=actor,
                payload={"transition": f"{old.value}->{new_status.value}"},
            )
        )

    async def set_plan(self, task: Task, plan: Plan) -> None:
        task.plan = plan
        await self._repo.save(task)
        await self._bus.publish(
            Event(type=EventType.PLAN_UPDATED, task_id=task.id, payload={"plan_id": plan.id, "version": plan.version})
        )

    async def set_final(self, task: Task, result: Result, status: TaskStatus) -> None:
        task.final_result = result
        await self.transition(task, status)
