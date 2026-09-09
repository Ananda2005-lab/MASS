"""Tiny MCP server (stdio) used to prove the real MCP client end-to-end.

Configure via env:
AAP_MCP_SERVERS='[{"name":"demo","command":".venv/bin/python","args":["scripts/mcp_demo_server.py"]}]'
"""
try:
    from mcp.server.fastmcp import FastMCP as _Server  # mcp 1.x
except ImportError:  # mcp 2.x renamed FastMCP -> MCPServer
    from mcp.server.mcpserver import MCPServer as _Server

mcp = _Server("demo")


@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b


@mcp.tool()
def shout(text: str) -> str:
    """Uppercase the text."""
    return text.upper()


if __name__ == "__main__":
    mcp.run()
