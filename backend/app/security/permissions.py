"""Security: permission layer for tools (implementation/17-security.md 17.2).

Every risky/destructive tool requires an approved permission_ticket before execution.
Unapproved -> ToolResult.status = permission_denied (no silent run).
"""
from __future__ import annotations

from app.core.tool import Permission, ToolInvocation, ToolResult, ToolResultStatus
from app.exceptions import PermissionDeniedError
from app.log import get_logger

logger = get_logger("security.permissions")


class PermissionChecker:
    def __init__(self, approved_tickets: set[str] | None = None) -> None:
        self._approved = approved_tickets or set()

    async def check(self, permissions: list[Permission], invocation: ToolInvocation) -> bool:
        """Return True if invocation may proceed. Destructive tools need a ticket."""
        needs_ticket = any(p.name in ("fs:write", "exec:sandbox", "exec:terminal", "network") for p in permissions)
        if not needs_ticket:
            return True
        if invocation.permission_ticket and invocation.permission_ticket in self._approved:
            return True
        logger.warning("permission_denied", tool=invocation.tool_id, ticket=invocation.permission_ticket)
        return False

    def approve(self, ticket: str) -> None:
        self._approved.add(ticket)


def denied_result(invocation: ToolInvocation, reason: str) -> ToolResult:
    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.PERMISSION_DENIED,
        error={"code": "permission_denied", "message": reason},
    )
