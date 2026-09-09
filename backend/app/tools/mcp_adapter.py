"""MCP adapter — real Model Context Protocol client.

Servers are configured via settings.mcp_servers (env AAP_MCP_SERVERS, JSON list)
plus a bundled default (filesystem) and runtime-attached servers (project folder):
    [{"name": "demo", "command": "python", "args": ["server.py"], "env": {}}]

discover() connects to each server over stdio, lists its tools and returns them
as Tool(impl_kind="mcp") definitions registered like any other tool. invoke()
opens a stateless stdio session to the mapped server and calls the tool.
Tolerant by design: missing `mcp` package or dead server never crashes runtime.
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.tool import (
    ErrorHandling,
    ExecutionKind,
    Tool,
    ToolCategory,
    ToolInvocation,
    ToolMetadata,
    ToolResult,
    ToolResultStatus,
)
from app.log import get_logger

logger = get_logger("tools.mcp_adapter")


class MCPAdapter:
    def __init__(self, servers: Optional[list[dict]] = None) -> None:
        self._servers: list[dict] = servers or []
        # tool_id -> (server config, remote tool name)
        self._routes: dict[str, tuple[dict, str]] = {}

    async def discover(self) -> list[Tool]:
        """Connect to all configured MCP servers and enumerate their tools."""
        tools: list[Tool] = []
        for srv in list(self._servers):
            tools.extend(await self._discover_server(srv))
        return tools

    async def _discover_server(self, srv: dict) -> list[Tool]:
        """Discover tools from ONE server; never raises."""
        if not srv.get("command"):
            return []
        try:
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client
        except ImportError:
            logger.warning("mcp_package_unavailable", returning_empty=True)
            return []

        name = str(srv.get("name") or "mcp")
        params = StdioServerParameters(
            command=str(srv.get("command") or ""),
            args=[str(a) for a in (srv.get("args") or [])],
            env={str(k): str(v) for k, v in (srv.get("env") or {}).items()} or None,
        )
        tools: list[Tool] = []
        try:
            async with stdio_client(params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    listed = await session.list_tools()
            for t in listed.tools:
                tool_id = f"mcp.{name}.{t.name}"
                self._routes[tool_id] = (srv, t.name)
                schema = (
                    getattr(t, "inputSchema", None)
                    or getattr(t, "input_schema", None)
                    or {"type": "object", "properties": {}}
                )
                tools.append(
                    Tool(
                        id=tool_id,
                        handler_ref=tool_id,
                        impl_kind="mcp",
                        metadata=ToolMetadata(
                            name=f"{name}/{t.name}",
                            description=(t.description or f"MCP tool {t.name} from {name}")[:300],
                            category=ToolCategory.CUSTOM,
                            execution=ExecutionKind.ASYNC,
                            error_handling=ErrorHandling.FALLBACK,
                            permissions=[],
                            input_schema=schema,
                            output_schema={"type": "object"},
                        ),
                    )
                )
            logger.info("mcp_discovered", server=name, tools=len(listed.tools))
        except Exception as exc:  # noqa: BLE001 - one dead server must not kill the rest
            logger.warning("mcp_discover_failed", server=name, error=str(exc)[:200])
        return tools

    async def invoke(self, tool: Tool, invocation: ToolInvocation) -> ToolResult:
        """Stateless stdio call to the server mapped for this tool id."""
        route = self._routes.get(tool.id)
        if route is None:
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={"code": "mcp_not_configured", "message": f"no route for {tool.id}"},
            )
        srv, remote_name = route
        try:
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client
        except ImportError:
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={"code": "mcp_package_unavailable", "message": "install `mcp` package"},
            )

        params = StdioServerParameters(
            command=str(srv.get("command") or ""),
            args=[str(a) for a in (srv.get("args") or [])],
            env={str(k): str(v) for k, v in (srv.get("env") or {}).items()} or None,
        )
        try:
            async with stdio_client(params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    res = await session.call_tool(remote_name, dict(invocation.params or {}))
            parts: list[str] = []
            for c in res.content or []:
                text = getattr(c, "text", None)
                if text is not None:
                    parts.append(text)
            output: dict[str, Any] = {"text": "\n".join(parts)}
            is_err = bool(getattr(res, "isError", getattr(res, "is_error", False)))
            if is_err:
                return ToolResult(
                    invocation_id=invocation.id,
                    status=ToolResultStatus.FAILURE,
                    error={"code": "mcp_tool_error", "message": output["text"][:300]},
                )
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.SUCCESS,
                output=output,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("mcp_invoke_failed", tool=tool.id, error=str(exc)[:200])
            return ToolResult(
                invocation_id=invocation.id,
                status=ToolResultStatus.FAILURE,
                error={"code": "mcp_error", "message": str(exc)[:300]},
            )
