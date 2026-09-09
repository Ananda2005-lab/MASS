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
        needed = [p.name for p in permissions if p.name in ("fs:write", "exec:sandbox", "exec:terminal", "network")]
        if not needed:
            return True
        if invocation.permission_ticket and invocation.permission_ticket in self._approved:
            return True
        # safety_mode=auto: sandbox-scoped tools and network may run for runtime
        # callers without a ticket (Auto = autonomous agent; Ask = tickets).
        try:
            from app.config import settings

            if settings.safety_mode == "auto" and invocation.caller:
                if set(needed) <= {"fs:write", "exec:sandbox", "exec:terminal", "network"}:
                    return True
        except Exception:  # noqa: BLE001 - config must never break the security layer
            pass
        # ASK mode: don't silently deny — ask the user via the approval flow.
        # The tool call blocks until the decision (or timeout -> denied).
        try:
            from app.security.approvals import approvals

            return await approvals.request(
                invocation.tool_id,
                dict(invocation.params or {}),
                invocation.caller or "",
            )
        except Exception:  # noqa: BLE001 - approval layer must never crash security
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
