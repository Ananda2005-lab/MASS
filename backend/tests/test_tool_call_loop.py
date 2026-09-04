"""Step 1 — Agent -> Tool Execution Loop: focused tests (A-H + gateway/timeout).

These exercise ONLY the tool-call wiring: registry lookup, role-capability
restriction, argument validation, permission check, execution, structured
failures, events, and continuation. Real LLM providers are NOT used.
"""
from __future__ import annotations

import asyncio

import pytest

from app.core.event import EventType
from app.core.llm import LLMCapability, LLMRequest, Message
from app.core.sub_agent import SubAgentRole
from app.core.tool import ToolInvocation, ToolResultStatus
from app.gateway.bootstrap import build_default_gateway
from app.runtime.managers.tool_manager import create_tool_manager
from app.runtime.tool_call import ToolCallDispatcher


class RecordingBus:
    def __init__(self) -> None:
        self.events: list = []

    async def publish(self, event) -> None:
        self.events.append(event)

    async def replay(self, *a, **k) -> list:
        return []


@pytest.fixture
def bus() -> RecordingBus:
    return RecordingBus()


@pytest.fixture
def tm():
    return create_tool_manager()


@pytest.fixture
def dispatcher(tm, bus) -> ToolCallDispatcher:
    return ToolCallDispatcher(tm, bus)


# A. Valid tool request -> executes -> result returns to agent.
async def test_A_valid_tool_request(dispatcher, bus):
    res = await dispatcher.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id="files.list", params={}))
    assert res.status == ToolResultStatus.SUCCESS
    assert "entries" in res.output


# B. Unknown tool -> rejected, not executed.
async def test_B_unknown_tool(dispatcher, bus):
    res = await dispatcher.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id="no.such.tool", params={}))
    assert res.status == ToolResultStatus.FAILURE
    assert res.error["code"] == "unknown_tool"


# C. Invalid arguments -> rejected, tool not executed.
async def test_C_invalid_arguments(dispatcher, bus):
    res = await dispatcher.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id="files.read", params={}))
    assert res.status == ToolResultStatus.FAILURE
    assert res.error["code"] == "invalid_arguments"


# D. Permission denied -> rejected, tool not executed; permission event recorded.
async def test_D_permission_denied(dispatcher, bus):
    res = await dispatcher.dispatch(
        SubAgentRole.CODING, ToolInvocation(tool_id="terminal.exec", params={"cmd": "echo hi"})
    )
    assert res.status == ToolResultStatus.PERMISSION_DENIED
    assert any(e.type == EventType.PERMISSION_REQUESTED for e in bus.events)


# E. Tool throws an exception -> structured failure, runtime does not crash.
async def test_E_tool_exception(dispatcher, bus):
    res = await dispatcher.dispatch(
        SubAgentRole.FILE, ToolInvocation(tool_id="files.read", params={"path": "missing.txt"})
    )
    assert res.status == ToolResultStatus.FAILURE
    assert res.error is not None


# F. Successful tool result -> execution can continue (no unbounded loop).
async def test_F_continuation(dispatcher, bus):
    r1 = await dispatcher.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id="files.list", params={}))
    assert r1.status == ToolResultStatus.SUCCESS
    r2 = await dispatcher.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id="files.list", params={}))
    assert r2.status == ToolResultStatus.SUCCESS
    # Both attempts produced the full lifecycle events.
    assert sum(1 for e in bus.events if e.type == EventType.TOOL_INVOKED) == 2
    assert sum(1 for e in bus.events if e.type == EventType.TOOL_RESULT) == 2


# G. Role restriction -> unauthorized sub-agent cannot execute a restricted tool.
async def test_G_role_restriction(dispatcher, bus):
    res = await dispatcher.dispatch(
        SubAgentRole.RESEARCH,
        ToolInvocation(tool_id="files.write", params={"path": "x", "content": "y"}),
    )
    assert res.status == ToolResultStatus.FAILURE
    assert res.error["code"] == "role_not_allowed"


# H. Event/state behavior -> appropriate existing task events are produced.
async def test_H_events(dispatcher, bus):
    await dispatcher.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id="files.list", params={}))
    types = {e.type for e in bus.events}
    assert EventType.TOOL_INVOKED in types
    assert EventType.TOOL_RESULT in types


# I. Deterministic tool-call decision through the existing Gateway/adapter, then executed.
async def test_I_gateway_tool_call_decision():
    gw = build_default_gateway()
    req = LLMRequest(
        capability=LLMCapability.CHAT,
        messages=[Message(role="user", content="act")],
        params={"tool_call": {"tool_id": "files.list", "params": {}}},
    )
    resp = await gw.complete(req)
    decision = resp.content
    assert isinstance(decision, dict)
    # Fake adapter echoes the deterministic tool-call decision via the gateway.
    tc = decision.get("content", {}).get("tool_call") if isinstance(decision.get("content"), dict) else decision.get("tool_call")
    assert tc is not None

    d = ToolCallDispatcher(create_tool_manager(), None)
    res = await d.dispatch(SubAgentRole.FILE, ToolInvocation(tool_id=tc["tool_id"], params=tc["params"]))
    assert res.status == ToolResultStatus.SUCCESS


# J. Timeout support (when the tool abstraction allows it).
async def test_J_timeout(tm, bus):
    async def slow(inv):
        await asyncio.sleep(0.2)
        return None

    tm.invoke = slow  # monkeypatch a slow execution
    d = ToolCallDispatcher(tm, bus)
    res = await d.dispatch(
        SubAgentRole.FILE, ToolInvocation(tool_id="files.list", params={}, timeout_ms=10)
    )
    assert res.status == ToolResultStatus.TIMEOUT
