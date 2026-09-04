"""Sub-Agent Manager: the single controlled entry point for sub-agent execution.

Spec: Phase 1 §5-§7, §14. The Orchestrator delegates to sub-agents ONLY via this
manager. It enforces the contract (max retries, fallback_role), guarantees a
mandatory non-empty `rationale`, and optionally emits lifecycle events through a
provided event bus. Sub-agents are MANAGED units; they cannot spawn other
sub-agents from within handlers.
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.event import Event, EventActor, EventType
from app.core.sub_agent import (
    SubAgentContext,
    SubAgentResult,
    SubAgentRole,
)
from app.core.task import ResultStatus
from app.core.tool import ToolInvocation, ToolResult
from app.log import get_logger
from app.runtime.sub_agents import CONTRACTS, ROLE_HANDLERS
from app.runtime.tool_call import ToolCallDispatcher

logger = get_logger("sub_agent.manager")


class SubAgentManager:
    def __init__(self, gateway, tool_manager, memory_manager=None, event_bus=None):
        self.gateway = gateway
        self.tool_manager = tool_manager
        self.memory_manager = memory_manager
        self.event_bus = event_bus
        # Approved runtime path for agent -> tool execution (Step 1). Reuses the
        # existing ToolManager (registry + permission + execution) and event bus.
        self.dispatcher = ToolCallDispatcher(tool_manager, event_bus)

    async def call_tool(
        self, role: SubAgentRole, invocation: ToolInvocation, task_id: str = "", step_id: str = ""
    ) -> ToolResult:
        """Single approved entry point for an agent to request a tool.

        Routes through the Tool Registry + permission layer; never bypasses them.
        """
        return await self.dispatcher.dispatch(role, invocation, task_id=task_id, step_id=step_id)

    async def run_sub_agent(self, role: SubAgentRole, ctx: SubAgentContext) -> SubAgentResult:
        # (a) Unknown role -> immediate FAILURE with "unknown role" error.
        handler = ROLE_HANDLERS.get(role)
        if handler is None:
            return SubAgentResult(
                role=role,
                status=ResultStatus.FAILURE,
                rationale=f"No handler is registered for role '{role.value}'.",
                error={
                    "code": "unknown_role",
                    "message": f"unknown role: {role.value}",
                    "source": "agent",
                },
            )

        contract = CONTRACTS.get(role)
        max_retries = contract.max_retries if contract else 2
        max_attempts = max_retries + 1

        await self._publish(
            EventType.SUB_AGENT_SELECTED, ctx, {"role": role.value}, EventActor.AGENT
        )

        # (b) Attempt the handler up to (max_retries + 1) times.
        last_error: Optional[dict[str, Any]] = None
        result: Optional[SubAgentResult] = None
        for attempt in range(max_attempts):
            try:
                result = await handler(ctx, self.gateway, self.tool_manager)
                if result is not None and result.rationale:
                    break
                last_error = {
                    "code": "empty_result",
                    "message": "handler returned no rationale",
                    "source": "agent",
                    "retryable": True,
                }
            except Exception as exc:  # noqa: BLE001
                last_error = {
                    "code": "handler_exception",
                    "message": str(exc),
                    "source": "agent",
                    "retryable": True,
                }
                logger.warning(
                    "sub_agent_attempt_failed", role=role.value, attempt=attempt, error=str(exc)
                )

        # (b) On failure, try the contract's fallback_role exactly once.
        if (result is None or result.status != ResultStatus.SUCCESS) and contract and contract.fallback_role:
            fb_role = contract.fallback_role
            fb_handler = ROLE_HANDLERS.get(fb_role)
            if fb_handler is not None:
                logger.info("sub_agent_fallback", role=role.value, fallback=fb_role.value)
                try:
                    result = await fb_handler(ctx, self.gateway, self.tool_manager)
                except Exception as exc:  # noqa: BLE001
                    last_error = {
                        "code": "fallback_exception",
                        "message": str(exc),
                        "source": "agent",
                    }

        # (d) Guarantee a well-formed result with a non-empty rationale.
        if result is None:
            result = SubAgentResult(
                role=role,
                status=ResultStatus.FAILURE,
                rationale=(
                    f"Sub-agent '{role.value}' failed after {max_attempts} attempt(s)."
                ),
                error=last_error
                or {"code": "no_result", "message": "no result produced", "source": "agent"},
            )

        if not result.rationale:
            result.rationale = (
                f"Sub-agent '{role.value}' completed but did not supply an explicit rationale."
            )

        await self._publish(
            EventType.SUB_AGENT_RESULT,
            ctx,
            {"role": role.value, "status": result.status.value},
            EventActor.AGENT,
        )
        return result

    async def _publish(self, etype: EventType, ctx: SubAgentContext, payload: dict, actor: EventActor) -> None:
        if self.event_bus is None:
            return
        try:
            event = Event(
                type=etype,
                task_id=ctx.task_id,
                step_id=ctx.step_id,
                actor=actor,
                payload=payload,
            )
            if hasattr(self.event_bus, "publish"):
                maybe = self.event_bus.publish(event)
                if maybe is not None:
                    await maybe
            elif callable(self.event_bus):
                maybe = self.event_bus(event)
                if maybe is not None:
                    await maybe
        except Exception:  # noqa: BLE001 - event emission must never break execution
            pass


def create_sub_agent_manager(
    gateway, tool_manager, memory_manager=None, event_bus=None
) -> SubAgentManager:
    """Factory used by the Orchestrator to build a managed sub-agent runtime."""
    return SubAgentManager(
        gateway, tool_manager, memory_manager=memory_manager, event_bus=event_bus
    )
