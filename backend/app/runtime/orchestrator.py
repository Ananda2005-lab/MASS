"""Orchestrator: central execution controller (implementation/06-orchestrator.md, 12).

Owns task decomposition execution, sub-agent/tool/model selection (delegated), ordering,
parallel-vs-sequential, dependency handling, verification points, and recovery
(retry/fix/replan, bounded). Honors user constraints without overriding security.
"""
from __future__ import annotations

import asyncio
from typing import Optional

from app.config import settings
from app.core.event import Event, EventActor, EventType
from app.core.sub_agent import SubAgentResult, SubAgentRole
from app.core.task import Step, StepStatus, Task, TaskStatus
from app.exceptions import TaskStateError
from app.log import get_logger
from app.persistence.repos import StepRepo, TaskRepo
from app.runtime.executor import Executor
from app.runtime.planner import Planner
from app.state.task_state import TaskStateStore
from app.verification.verifier import Verifier

logger = get_logger("orchestrator")


class Orchestrator:
    def __init__(
        self,
        state: TaskStateStore,
        executor: Executor,
        verifier: Verifier,
        planner: Planner,
        task_repo: TaskRepo,
        step_repo: StepRepo,
        event_bus=None,
    ) -> None:
        self._state = state
        self._executor = executor
        self._verifier = verifier
        self._planner = planner
        self._task_repo = task_repo
        self._step_repo = step_repo
        self._bus = event_bus

    async def execute(self, task: Task) -> Task:
        await self._state.transition(task, TaskStatus.EXECUTING, EventActor.SYSTEM)
        recovery_budget = settings.max_total_recovery_attempts

        while True:
            ready = [
                s for s in task.plan.steps
                if s.status == StepStatus.PENDING
                and all(d in {x.id for x in task.plan.steps if x.status == StepStatus.SUCCEEDED} for d in s.depends_on)
            ]
            if ready:
                # Parallel-safe batch: independent ready steps run together (Phase 1 §17).
                if len(ready) > 1 and task.plan.strategy.value == "parallel":
                    await asyncio.gather(*(self._run_step(task, s) for s in ready))
                else:
                    for s in ready:
                        await self._run_step(task, s)
                continue

            failed = [s for s in task.plan.steps if s.status == StepStatus.FAILED]
            if failed:
                if recovery_budget <= 0:
                    await self._fail(task, "recovery budget exhausted")
                    return task
                recovery_budget -= 1
                for s in failed:
                    await self._recover(task, s)
                continue

            # Nothing pending and nothing failed -> all succeeded.
            break

        if all(s.status == StepStatus.SUCCEEDED for s in task.plan.steps):
            await self._state.transition(task, TaskStatus.VERIFYING, EventActor.SYSTEM)
            final_ok = all(s.result and s.result.status.value == "success" for s in task.plan.steps if s.result)
            if final_ok:
                await self._state.set_final(task, _aggregate(task), TaskStatus.COMPLETED)
                await self._emit(task.id, EventType.TASK_COMPLETED, {})
            else:
                await self._fail(task, "final verification failed")
        else:
            await self._fail(task, "not all steps succeeded")
        return task

    async def _run_step(self, task: Task, step: Step) -> None:
        step.status = StepStatus.RUNNING
        await self._step_repo.save(task.id, step)
        result = await self._executor.run_step(task, step)
        step.result = result
        step.status = StepStatus.SUCCEEDED if result.status.value == "success" else StepStatus.FAILED
        await self._step_repo.save(task.id, step)

    async def _recover(self, task: Task, step: Step) -> None:
        """Bounded recovery: retry, then fallback role, then give up (06.4 / 12.5)."""
        step.retry_count += 1
        max_r = 2
        if step.retry_count <= max_r:
            step.status = StepStatus.PENDING  # retry same approach
            logger.info("recover_retry", step=step.id, attempt=step.retry_count)
        else:
            from app.core.sub_agent import SubAgentRole
            from app.runtime.sub_agents import CONTRACTS
            try:
                role = SubAgentRole(step.assigned_agent)
                fb = CONTRACTS.get(role)
                if fb and fb.fallback_role:
                    step.assigned_agent = fb.fallback_role.value
                    step.retry_count = 0
                    step.status = StepStatus.PENDING
                    logger.info("recover_fallback", step=step.id, role=fb.fallback_role.value)
                else:
                    step.status = StepStatus.FAILED  # no recovery left
            except Exception:
                step.status = StepStatus.FAILED

    async def _fail(self, task: Task, reason: str) -> None:
        await self._state.transition(task, TaskStatus.FAILED, EventActor.SYSTEM)
        await self._emit(task.id, EventType.TASK_FAILED, {"reason": reason})

    async def _emit(self, task_id: str, etype: EventType, payload: dict) -> None:
        if self._bus:
            await self._bus.publish(Event(type=etype, task_id=task_id, actor=EventActor.SYSTEM, payload=payload))


def _aggregate(task: Task):
    from app.core.task import Artifact, Result, ResultStatus
    # Final summary = ONLY the last step's real output (e.g. writing agent's text),
    # not the intermediate research/analysis rationales.
    last = task.plan.steps[-1] if task.plan.steps else None
    summary = (last.result.summary or "") if last and last.result else ""
    artifacts = [a for s in task.plan.steps if s.result for a in (s.result.artifacts or [])]
    return Result(
        step_id=last.id if last else "",
        status=ResultStatus.SUCCESS,
        artifacts=artifacts,
        summary=summary[:1000],
    )
