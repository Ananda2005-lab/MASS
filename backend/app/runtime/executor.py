"""Executor: run a single Step via Sub-Agent Manager (implementation/05.4).

Builds SubAgentContext from assembled memory + step inputs, delegates to SubAgentManager,
wraps the SubAgentResult into a core Result, and emits step events.
"""
from __future__ import annotations

from app.core.event import Event, EventActor, EventType
from app.core.sub_agent import SubAgentContext, SubAgentRole, SubAgentResult
from app.core.task import Artifact, Result, ResultStatus, Step, Task
from app.core.tool import ToolInvocation
from app.log import get_logger
from app.runtime.managers.memory_manager import MemoryManager
from app.runtime.managers.sub_agent_manager import SubAgentManager
from app.runtime.sub_agents import CONTRACTS
from app.verification.verifier import Verifier

logger = get_logger("executor")


class Executor:
    def __init__(
        self,
        sub_agent_manager: SubAgentManager,
        memory_manager: MemoryManager,
        event_bus=None,
        verifier: Verifier | None = None,
    ) -> None:
        self._sam = sub_agent_manager
        self._memory = memory_manager
        self._bus = event_bus
        self._verifier = verifier

    async def run_step(self, task: Task, step: Step) -> Result:
        task_id = task.id
        await self._emit(task_id, step.id, EventType.STEP_STARTED, {"goal": step.goal})
        role = SubAgentRole(step.assigned_agent) if step.assigned_agent else SubAgentRole.ANALYSIS
        bundle = await self._memory.assemble(
            task_id=task_id,
            step_id=step.id,
            goal=step.goal,
            inputs=step.input_refs,
            user_id=task.user_id,
        )
        ctx = SubAgentContext(
            task_id=task_id,
            step_id=step.id,
            goal=step.goal,
            inputs=step.input_refs,
            memory=bundle.model_dump(),
            tools=[],
            constraints=[c.model_dump() for c in task.intent.constraints],
        )
        try:
            res: SubAgentResult = await self._sam.run_sub_agent(role, ctx)
        except Exception as e:
            logger.error("step_failed", step=step.id, error=str(e))
            await self._emit(task_id, step.id, EventType.STEP_FAILED, {"error": str(e)})
            return Result(step_id=step.id, status=ResultStatus.FAILURE, error=_err(str(e)))

        # Verification at verification points uses the REAL SubAgentResult (decision 03).
        if self._verifier and step.id in task.plan.verification_points:
            v = self._verifier.verify_sub_agent(res, task.intent.classification)
            if not v.passed:
                logger.warning("verification_failed", step=step.id, findings=v.findings)
                await self._emit(task_id, step.id, EventType.STEP_FAILED, {"verification": v.findings})
                return Result(
                    step_id=step.id,
                    status=ResultStatus.FAILURE,
                    error=_err("verification failed: " + "; ".join(v.findings)),
                )

        # Step 1 (Agent -> Tool loop): route any planned tool calls for this step
        # through the Tool Registry. Non-fatal: tool success/failure is recorded via
        # the dispatcher's events; it does not override the sub-agent's reasoned result.
        tool_results = await self._run_planned_tools(task, step, role)

        status = ResultStatus.SUCCESS if res.status.value == "success" else ResultStatus.FAILURE
        artifacts = [Artifact(**a) if isinstance(a, dict) else a for a in (res.artifacts or [])]
        result = Result(
            step_id=step.id,
            status=status,
            artifacts=artifacts,
            summary=str(res.output.get("text") or res.output.get("code") or res.rationale)[:500],
            metrics={"rationale_len": len(res.rationale), "tool_calls": [r.status.value for r in tool_results]},
        )
        if status == ResultStatus.SUCCESS:
            await self._emit(task_id, step.id, EventType.STEP_COMPLETED, {"result_id": result.id})
        else:
            await self._emit(task_id, step.id, EventType.STEP_FAILED, {"error": res.error})
        return result

    async def _run_planned_tools(self, task: Task, step: Step, role: SubAgentRole) -> list:
        """Execute the step's planned tool_ids through the approved runtime path.

        Only tools that are registered AND allowed by the role's contract are run.
        Unknown tools are skipped; failures are structured and never crash the step.
        """
        out: list = []
        contract = CONTRACTS.get(role)
        allowed = set(contract.capabilities) if contract else set()
        for tid in step.tool_ids:
            tool = self._sam.tool_manager.get_tool(tid)
            if tool is None:
                continue  # unknown tool -> not executed (no failure)
            if tid not in allowed:
                continue  # role restriction authoritative
            invocation = ToolInvocation(tool_id=tid, params={}, caller=step.id)
            try:
                tr = await self._sam.call_tool(role, invocation, task_id=task.id, step_id=step.id)
            except Exception as exc:  # noqa: BLE001
                logger.error("planned_tool_failed", tool=tid, error=str(exc))
                continue
            if tr is not None:
                out.append(tr)
        return out

    async def _emit(self, task_id: str, step_id: str, etype: EventType, payload: dict) -> None:
        if self._bus:
            await self._bus.publish(
                Event(type=etype, task_id=task_id, step_id=step_id, actor=EventActor.AGENT, payload=payload)
            )


def _err(msg: str):
    from app.core.task import ErrorInfo, ErrorSource
    return ErrorInfo(code="step_error", message=msg, source=ErrorSource.AGENT, retryable=True)
