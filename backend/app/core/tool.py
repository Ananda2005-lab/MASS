"""Core contracts: Tool, ToolMetadata, ToolInvocation, ToolResult, Permission.

Spec: implementation/04-core-contracts.md (4.13-4.16) + 11-tool-mcp.md.
"""
from __future__ import annotations

import uuid
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.core.task import Ref


def _uid() -> str:
    return str(uuid.uuid4())


class ToolCategory(str, Enum):
    WEB = "web"
    SEARCH = "search"
    FILES = "files"
    CODE = "code"
    TERMINAL = "terminal"
    BROWSER = "browser"
    CALCULATOR = "calculator"
    CUSTOM = "custom"


class ExecutionKind(str, Enum):
    SYNC = "sync"
    ASYNC = "async"
    STREAMING = "streaming"


class ErrorHandling(str, Enum):
    RETRY = "retry"
    FAIL = "fail"
    FALLBACK = "fallback"


class ToolResultStatus(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    PERMISSION_DENIED = "permission_denied"
    TIMEOUT = "timeout"


class Permission(BaseModel):
    """A permission required to execute a tool (evaluated by Security layer)."""
    name: str  # e.g. fs:write, exec:sandbox, network
    description: str = ""


class ToolMetadata(BaseModel):
    name: str
    description: str
    input_schema: dict = Field(default_factory=dict)  # JSON Schema
    output_schema: dict = Field(default_factory=dict)  # JSON Schema
    permissions: list[Permission] = Field(default_factory=list)
    execution: ExecutionKind = ExecutionKind.ASYNC
    error_handling: ErrorHandling = ErrorHandling.FAIL
    category: ToolCategory = ToolCategory.CUSTOM
    cost_class: str = "moderate"  # cheap|moderate|expensive


class Tool(BaseModel):
    id: str
    metadata: ToolMetadata
    impl_kind: str = "native"  # native|mcp
    endpoint: Optional[str] = None
    handler_ref: str = ""


class ToolInvocation(BaseModel):
    id: str = Field(default_factory=_uid)
    tool_id: str
    params: dict[str, Any] = Field(default_factory=dict)
    context_refs: list[Ref] = Field(default_factory=list)
    permission_ticket: Optional[str] = None
    caller: str = ""  # step_id or user_id
    timeout_ms: int = 60_000


class ToolResult(BaseModel):
    id: str = Field(default_factory=_uid)
    invocation_id: str
    status: ToolResultStatus
    output: dict[str, Any] = Field(default_factory=dict)
    artifacts: list = Field(default_factory=list)
    error: Optional[dict[str, Any]] = None
    duration_ms: int = 0
