"""Native file tools operating inside a sandbox directory (./sandbox).

Spec: implementation/11-tool-mcp.md 11.3 (FILE tools). All paths are relative to
the sandbox root; absolute paths and any path traversal ('..' or leading '/') are
rejected with a ToolExecutionError.
"""
from __future__ import annotations

import os

from app.core.tool import Tool, ToolInvocation, ToolResult, ToolResultStatus
from app.core.task import Artifact
from app.exceptions import ToolExecutionError
from app.log import get_logger

logger = get_logger("tools.native.files")

SANDBOX_DIR = "./sandbox"


def _ensure_sandbox() -> str:
    os.makedirs(SANDBOX_DIR, exist_ok=True)
    return SANDBOX_DIR


def _safe_path(rel_path: str) -> str:
    """Resolve a sandbox-relative path, rejecting escapes. Raises ToolExecutionError."""
    if not isinstance(rel_path, str) or not rel_path:
        raise ToolExecutionError("invalid path: path must be a non-empty string")
    norm = rel_path.replace("\\", "/")
    if norm.startswith("/"):
        raise ToolExecutionError(f"absolute paths are not allowed: {rel_path!r}")
    if ".." in norm.split("/"):
        raise ToolExecutionError(f"path escapes sandbox: {rel_path!r}")
    base = os.path.abspath(_ensure_sandbox())
    target = os.path.abspath(os.path.join(base, norm))
    if target != base and not target.startswith(base + os.sep):
        raise ToolExecutionError(f"path escapes sandbox: {rel_path!r}")
    return target


async def read_file(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    path = invocation.params.get("path")
    if not isinstance(path, str) or not path:
        raise ToolExecutionError("missing or invalid 'path' param")
    full = _safe_path(path)
    if not os.path.isfile(full):
        raise ToolExecutionError(f"file not found: {path!r}")
    with open(full, "r", encoding="utf-8") as fh:
        content = fh.read()
    artifact = Artifact(type="file", name=os.path.basename(full), ref=full)
    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={"content": content},
        artifacts=[artifact],
    )


async def list_files(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    base = _ensure_sandbox()
    entries: list[dict] = []
    for name in sorted(os.listdir(base)):
        full = os.path.join(base, name)
        entries.append(
            {
                "name": name,
                "type": "dir" if os.path.isdir(full) else "file",
                "size": os.path.getsize(full) if os.path.isfile(full) else None,
            }
        )
    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={"entries": entries, "sandbox": base},
    )


async def write_file(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    path = invocation.params.get("path")
    content = invocation.params.get("content", "")
    if not isinstance(path, str) or not path:
        raise ToolExecutionError("missing or invalid 'path' param")
    if not isinstance(content, str):
        raise ToolExecutionError("'content' param must be a string")
    full = _safe_path(path)
    parent = os.path.dirname(full)
    if parent:
        os.makedirs(parent, exist_ok=True)
    encoded = content.encode("utf-8")
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)
    artifact = Artifact(
        type="file",
        name=os.path.basename(full),
        ref=full,
        size=len(encoded),
    )
    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={"written": True, "path": path, "bytes": len(encoded)},
        artifacts=[artifact],
    )
