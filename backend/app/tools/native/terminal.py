"""Terminal tool executing shell commands inside the sandbox cwd.

Spec: implementation/11-tool-mcp.md 11.3 (TERMINAL). If `settings.sandbox_enabled`
is False, returns a FAILURE result with code "sandbox_disabled". Otherwise runs the
command via subprocess (cwd=./sandbox) and returns stdout/stderr/returncode.
Destructive -> requires a permission ticket (handled by Security layer before dispatch).
"""
from __future__ import annotations

import os
import subprocess

from app.core.tool import Tool, ToolInvocation, ToolResult, ToolResultStatus
from app.config import settings
from app.exceptions import ToolExecutionError
from app.log import get_logger

logger = get_logger("tools.native.terminal")

SANDBOX_DIR = "./sandbox"


async def exec_command(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    cmd = invocation.params.get("cmd")
    if not isinstance(cmd, str) or not cmd.strip():
        raise ToolExecutionError("missing or empty 'cmd' param")

    if not settings.sandbox_enabled:
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={"code": "sandbox_disabled", "message": "sandbox disabled"},
        )

    os.makedirs(SANDBOX_DIR, exist_ok=True)
    timeout = (invocation.timeout_ms / 1000.0) if invocation.timeout_ms else 60.0

    try:
        proc = subprocess.run(
            cmd,
            shell=True,
            cwd=SANDBOX_DIR,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise ToolExecutionError(f"command timed out after {timeout}s: {cmd!r}", retryable=True)
    except OSError as exc:
        raise ToolExecutionError(f"command execution failed: {exc}", retryable=False)

    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
        },
    )
