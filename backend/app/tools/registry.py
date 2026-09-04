"""Tool registry (implementation/11-tool-mcp.md 11.2).

In-memory registry mapping tool ids to Tool definitions. Thread-unsafe by design
(single-event-loop registry); mutation happens at startup/build time.
"""
from __future__ import annotations

from typing import Optional

from app.core.tool import Tool, ToolCategory
from app.log import get_logger

logger = get_logger("tools.registry")


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.id] = tool
        logger.info("tool_registered", tool_id=tool.id, category=tool.metadata.category.value)

    def get(self, tool_id: str) -> Optional[Tool]:
        return self._tools.get(tool_id)

    def list_all(self) -> list[Tool]:
        return list(self._tools.values())

    def list_by_category(self, cat: ToolCategory) -> list[Tool]:
        return [t for t in self._tools.values() if t.metadata.category == cat]
