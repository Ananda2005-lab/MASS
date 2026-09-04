"""Agent -> Tool Execution Loop (Step 1).

Wires the existing Agent/Executor runtime to the existing Tool Registry so an agent
can request a tool, have it validated + authorized, executed, and the result returned,
while execution can continue.

Reuses (does NOT redesign):
- `ToolInvocation` as the tool-call request (tool name, args, request id, ticket).
- `ToolResult` as the result/error/execution-status carrier.
- `ToolManager.invoke` as the single registry + permission + execution path.
- `SubAgentContract.capabilities` as the authoritative role/tool restriction.
- Existing events: TOOL_INVOKED, TOOL_RESULT, PERMISSION_REQUESTED, PERMISSION_RESOLVED.

Locked architecture, contracts, and LLM Gateway are untouched. No real provider added.
"""
from __future__ import annotations

import asyncio
from typing import Optional

from app.core.event import Event, EventActor, EventType
from app.core.sub_agent import SubAgentRole
from app.core.tool import (
    ToolInvocation,
    ToolResult,
    ToolResultStatus,
)
from app.log import get_logger
from app.runtime.sub_agents import CONTRACTS

logger = get_logger("runtime.tool_call")


class ToolCallDispatcher:
    """Routes an agent tool-call request through the approved runtime path.

    Flow: registry lookup -> role-capability check -> argument validation ->
    permission check (inside ToolManager) -> execution -> structured ToolResult.
    """

    def __init__(self, tool_manager, event_bus=None) -> None:
        self._tm = tool_manager
        self._bus = event_bus

    async def dispatch(
        self,
        role: SubAgentRole,
        invocation: ToolInvocation,
        task_id: str = "",
        step_id: Optional[str] = None,
    ) -> ToolResult:
        step_id = step_id or invocation.caller
        tool_id = invocation.tool_id

        await self._emit(
            EventType.TOOL_INVOKED,
            task_id, step_id,
            {"tool_id": tool_id, "invocation_id": invocation.id, "role": role.value},
            EventActor.TOOL,
        )

        # 1) Registry lookup.
        tool = self._tm.get_tool(tool_id)
        if tool is None:
            result = ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={"code": "unknown_tool", "message": f"no tool registered with id {tool_id!r}"},
            )
            await self._emit(
                EventType.TOOL_RESULT, task_id, step_id,
                {"tool_id": tool_id, "status": "failure", "error_code": "unknown_tool"},
                EventActor.TOOL,
            )
            return result

        # 2) Role / capability restriction (authoritative from SubAgentContract).
        contract = CONTRACTS.get(role)
        allowed = set(contract.capabilities) if contract else set()
        if tool_id not in allowed:
            result = ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={
                    "code": "role_not_allowed",
                    "message": f"role {role.value} is not permitted to use tool {tool_id!r}",
                },
            )
            await self._emit(
                EventType.TOOL_RESULT, task_id, step_id,
                {"tool_id": tool_id, "status": "failure", "error_code": "role_not_allowed"},
                EventActor.TOOL,
            )
            return result

        # 3) Argument validation against the existing tool input schema.
        schema = tool.metadata.input_schema or {}
        required = schema.get("required", []) or []
        missing = [k for k in required if k not in invocation.params]
        if missing:
            result = ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={"code": "invalid_arguments", "message": f"missing required args: {missing}"},
            )
            await self._emit(
                EventType.TOOL_RESULT, task_id, step_id,
                {"tool_id": tool_id, "status": "failure", "error_code": "invalid_arguments"},
                EventActor.TOOL,
            )
            return result

        # 4) Execute through the existing ToolManager (registry + permission + run).
        try:
            result = await asyncio.wait_for(
                self._tm.invoke(invocation),
                timeout=invocation.timeout_ms / 1000.0 if invocation.timeout_ms > 0 else None,
            )
        except asyncio.TimeoutError:
            result = ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.TIMEOUT,
                error={"code": "timeout", "message": f"tool {tool_id!r} exceeded {invocation.timeout_ms}ms"},
            )
        except Exception as exc:  # noqa: BLE001 - never crash the runtime
            result = ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={"code": "tool_execution_error", "message": str(exc)},
            )

        # 5) Emit lifecycle events + permission signalling.
        if result.status == ToolResultStatus.PERMISSION_DENIED:
            await self._emit(
                EventType.PERMISSION_REQUESTED, task_id, step_id,
                {"tool_id": tool_id, "ticket": invocation.permission_ticket},
                EventActor.TOOL,
            )
            await self._emit(
                EventType.PERMISSION_RESOLVED, task_id, step_id,
                {"tool_id": tool_id, "allowed": False},
                EventActor.TOOL,
            )
        await self._emit(
            EventType.TOOL_RESULT, task_id, step_id,
            {
                "tool_id": tool_id,
                "status": result.status.value,
                "error_code": (result.error or {}).get("code") if result.error else None,
                "invocation_id": invocation.id,
            },
            EventActor.TOOL,
        )
        return result

    async def _emit(self, etype, task_id, step_id, payload, actor) -> None:
        if self._bus is None:
            return
        try:
            event = Event(
                type=etype, task_id=task_id, step_id=step_id, actor=actor, payload=payload
            )
            maybe = self._bus.publish(event)
            if maybe is not None:
                await maybe
        except Exception:  # noqa: BLE001 - event emission must never break execution
            pass
