"""Tool manager: orchestrates tool resolution, permission checks, and dispatch.

Spec: implementation/11-tool-mcp.md 11.4. The ToolManager is the single entry point
used by the runtime to execute a ToolInvocation: it resolves the Tool from the
registry, enforces permissions via the Security layer, dispatches to either the MCP
adapter or a native handler, applies retry-once for retryable errors, and records
duration. It does NOT bypass the permission layer.
"""
from __future__ import annotations

import time
from typing import Optional

from app.core.tool import (
    Tool,
    ToolInvocation,
    ToolResult,
    ToolResultStatus,
    ErrorHandling,
)
from app.config import settings
from app.security.permissions import PermissionChecker, denied_result
from app.exceptions import ToolExecutionError
from app.log import get_logger

from app.tools.registry import ToolRegistry
from app.tools.native import build_native_tools, NATIVE_HANDLERS
from app.tools.mcp_adapter import MCPAdapter

logger = get_logger("runtime.managers.tool_manager")

# Module-level adapter shared by all ToolManager instances. Server list comes from
# settings.mcp_servers (env AAP_MCP_SERVERS). Tolerant on import.
_mcp_adapter = MCPAdapter()


def mcp_adapter() -> MCPAdapter:
    return _mcp_adapter


async def attach_mcp_tools(manager: "ToolManager") -> int:
    """Discover MCP server tools (if configured) and register them. Returns count.

    Like Codex/Claude: a default bundled server ships pre-added (filesystem,
    rooted at ./sandbox for safety) and user servers from AAP_MCP_SERVERS merge
    on top. Dead/missing servers only warn — never break startup.
    """
    import os

    default_servers = [
        {
            "name": "filesystem",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", os.path.abspath("./sandbox")],
        },
    ]
    user_servers = list(getattr(settings, "mcp_servers", []) or [])
    total = 0
    for cfg in default_servers + user_servers:
        total += await attach_mcp_server(manager, cfg, remember=False)
    return total


async def attach_mcp_server(manager: "ToolManager", cfg: dict, remember: bool = True) -> int:
    """Discover ONE MCP server and register its tools on the manager."""
    tools = await _mcp_adapter._discover_server(cfg)
    if tools and remember:
        _mcp_adapter._servers.append(cfg)
    for t in tools:
        manager.register(t)
    return len(tools)


def build_default_tools() -> list[Tool]:
    """Return the default native tool definitions (files, calculator, terminal, browser)."""
    return build_native_tools()


def create_tool_manager() -> "ToolManager":
    """Build a ToolManager with the registry pre-populated with default tools."""
    registry = ToolRegistry()
    for tool in build_default_tools():
        registry.register(tool)
    return ToolManager(registry=registry, permission_checker=PermissionChecker())


class ToolManager:
    def __init__(self, registry: ToolRegistry, permission_checker: PermissionChecker) -> None:
        self._registry = registry
        self._permission_checker = permission_checker

    def register(self, tool: Tool) -> None:
        self._registry.register(tool)

    def get_tool(self, tool_id: str) -> Optional[Tool]:
        return self._registry.get(tool_id)

    def list_tools(self) -> list[Tool]:
        return self._registry.list_all()

    async def invoke(self, invocation: ToolInvocation, caller: str = "") -> ToolResult:
        if caller:
            invocation.caller = caller

        # user-controlled live gating (UI switch)
        try:
            from app.config import settings

            disabled = {x.strip() for x in (settings.disabled_tools or "").split(",") if x.strip()}
            if invocation.tool_id in disabled:
                return ToolResult(
                    invocation_id=invocation.id,
                    status=ToolResultStatus.FAILURE,
                    error={"code": "disabled_by_user", "message": f"{invocation.tool_id} is disabled in the UI"},
                )
        except Exception:  # noqa: BLE001 - gating must never crash dispatch
            pass

        tool = self._registry.get(invocation.tool_id)
        if tool is None:
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={
                    "code": "unknown_tool",
                    "message": f"no tool registered with id {invocation.tool_id!r}",
                },
            )

        allowed = await self._permission_checker.check(tool.metadata.permissions, invocation)
        if not allowed:
            return denied_result(invocation, "permission required")

        start = time.monotonic()

        # MCP-backed tools
        if tool.impl_kind == "mcp":
            try:
                result = await _mcp_adapter.invoke(tool, invocation)
            except Exception as exc:  # noqa: BLE001 - never crash the runtime
                logger.error("mcp_invoke_error", error=str(exc))
                return ToolResult(
                    invocation_id=invocation.id,
                    status=ToolResultStatus.FAILURE,
                    error={"code": "mcp_error", "message": str(exc)},
                )
            result.duration_ms = int((time.monotonic() - start) * 1000)
            return result

        # Native tools
        handler = NATIVE_HANDLERS.get(tool.handler_ref)
        if handler is None:
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={
                    "code": "unknown_handler",
                    "message": f"no native handler for handler_ref {tool.handler_ref!r}",
                },
            )

        attempts = 2 if tool.metadata.error_handling == ErrorHandling.RETRY else 1
        last_err: Optional[ToolExecutionError] = None
        result: Optional[ToolResult] = None

        for _ in range(attempts):
            try:
                result = await handler(invocation, tool)
                break
            except ToolExecutionError as exc:
                last_err = exc
                if not exc.retryable:
                    break
                logger.warning("tool_retry", tool=tool.id, message=exc.message)

        duration_ms = int((time.monotonic() - start) * 1000)

        if last_err is not None and result is None:
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={
                    "code": last_err.code,
                    "message": last_err.message,
                    "retryable": last_err.retryable,
                },
                duration_ms=duration_ms,
            )

        if result is not None:
            result.duration_ms = duration_ms
            return result

        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={"code": "unknown", "message": "tool produced no result"},
            duration_ms=duration_ms,
        )
