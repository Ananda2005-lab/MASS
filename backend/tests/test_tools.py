"""T7 — Tool registry, native tools, MCP adapter, permission layer, secret isolation."""
import pytest
import os
from app.tools.registry import ToolRegistry
from app.tools.native import build_native_tools
from app.tools.mcp_adapter import MCPAdapter
from app.runtime.managers.tool_manager import ToolManager
from app.core.tool import ToolInvocation, ToolResultStatus
from app.security.permissions import PermissionChecker
from app.security.secrets import redact
from app.exceptions import ToolExecutionError


def _tm_with_ticket(ticket=None):
    reg = ToolRegistry()
    for t in build_native_tools():
        reg.register(t)
    approved = {ticket} if ticket else set()
    pc = PermissionChecker(approved)
    return ToolManager(reg, pc)


@pytest.mark.asyncio
async def test_registry_and_native_tools():
    tm = _tm_with_ticket()
    ids = {t.id for t in tm.list_tools()}
    assert {"files.read", "files.write", "calculator.eval", "terminal.exec", "browser.navigate"} <= ids


@pytest.mark.asyncio
async def test_calculator_safe_eval():
    tm = _tm_with_ticket()
    res = await tm.invoke(ToolInvocation(tool_id="calculator.eval", params={"expression": "2+3*4"}))
    assert res.status == ToolResultStatus.SUCCESS
    assert res.output["result"] == 14


@pytest.mark.asyncio
async def test_calculator_rejects_unsafe():
    tm = _tm_with_ticket()
    res = await tm.invoke(ToolInvocation(tool_id="calculator.eval", params={"expression": "__import__('os').system('echo x')"}))
    assert res.status == ToolResultStatus.FAILURE


@pytest.mark.asyncio
async def test_destructive_tool_denied_without_ticket():
    tm = _tm_with_ticket()
    res = await tm.invoke(ToolInvocation(tool_id="files.write", params={"path": "a.txt", "content": "hi"}))
    assert res.status == ToolResultStatus.PERMISSION_DENIED


@pytest.mark.asyncio
async def test_destructive_tool_allowed_with_ticket():
    ticket = "tok-1"
    tm = _tm_with_ticket(ticket)
    res = await tm.invoke(ToolInvocation(tool_id="files.write", params={"path": "a.txt", "content": "hi"}, permission_ticket=ticket))
    assert res.status == ToolResultStatus.SUCCESS
    # read it back
    r2 = await tm.invoke(ToolInvocation(tool_id="files.read", params={"path": "a.txt"}))
    assert r2.status == ToolResultStatus.SUCCESS and "hi" in str(r2.output)


@pytest.mark.asyncio
async def test_files_sandbox_rejects_escape():
    tm = _tm_with_ticket("t")
    res = await tm.invoke(ToolInvocation(tool_id="files.write", params={"path": "../escape.txt", "content": "x"}, permission_ticket="t"))
    assert res.status == ToolResultStatus.FAILURE


@pytest.mark.asyncio
async def test_browser_degrades_gracefully():
    tm = _tm_with_ticket("b")
    res = await tm.invoke(ToolInvocation(tool_id="browser.navigate", params={"url": "https://example.com"}, permission_ticket="b"))
    # never crashes; returns a dict observation whether or not real Playwright is present
    assert isinstance(res.output, dict)
    assert res.status in (ToolResultStatus.SUCCESS, ToolResultStatus.FAILURE)
    assert "url" in res.output or "observation" in res.output


@pytest.mark.asyncio
async def test_mcp_adapter_tolerant_when_unavailable():
    adapter = MCPAdapter([])
    tools = await adapter.discover()  # must not crash; returns [] when no live server
    assert tools == []


def test_secret_redaction():
    assert redact({"api_key": "secret", "mode": "x"})["api_key"] == "***redacted***"
    assert redact({"mode": "x"})["mode"] == "x"
