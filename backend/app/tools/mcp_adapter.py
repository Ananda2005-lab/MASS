"""MCP adapter (tolerant stub).

Spec: implementation/11-tool-mcp.md 11.5. Provides the MCP integration boundary so a
real Model Context Protocol server can be plugged in later. The adapter must NEVER
crash on import (the `mcp` package is optional). `discover()` returns [] if `mcp` is
unavailable; `invoke()` returns a FAILURE result with code "mcp_not_configured" when
no live server is connected.
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.tool import Tool, ToolInvocation, ToolResult, ToolResultStatus
from app.log import get_logger

logger = get_logger("tools.mcp_adapter")


class MCPAdapter:
    def __init__(self, servers: Optional[list[dict]] = None) -> None:
        self._servers: list[dict] = servers or []
        self._live: list[Any] = []

    async def discover(self) -> list[Tool]:
        """Discover tools exposed by configured MCP servers.

        If the `mcp` package is not importable, logs a warning and returns an empty
        list (tolerant, no crash). Real connection/discovery is a future extension.
        """
        try:
            import mcp  # noqa: F401  (optional dependency)
        except ImportError:
            logger.warning("mcp_package_unavailable", returning_empty=True)
            return []
        # Future implementation: connect to each self._servers entry, enumerate tools,
        # and return them as Tool(impl_kind="mcp", ...). Not wired yet.
        logger.info("mcp_discover_stub", configured_servers=len(self._servers))
        return []

    async def invoke(self, tool: Tool, invocation: ToolInvocation) -> ToolResult:
        """Invoke an MCP-backed tool. Returns FAILURE until a live server is attached."""
        if not self._live:
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={
                    "code": "mcp_not_configured",
                    "message": "no live MCP server configured",
                },
            )
        # Future implementation: route to the live server mapped to tool.endpoint.
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={
                "code": "mcp_not_configured",
                "message": "no live MCP server configured",
            },
        )
