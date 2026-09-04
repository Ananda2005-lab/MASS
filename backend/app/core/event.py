"""Core contracts: Event envelope + ContextBundle.

Spec: implementation/04-core-contracts.md (4.24-4.25) + 13-task-state-events.md + 10-memory-context.md (decision 05).
"""
from __future__ import annotations

import uuid
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


def _uid() -> str:
    return str(uuid.uuid4())


class EventType(str, Enum):
    TASK_CREATED = "task_created"
    PLAN_UPDATED = "plan_updated"
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    STEP_FAILED = "step_failed"
    TOOL_INVOKED = "tool_invoked"
    TOOL_RESULT = "tool_result"
    LLM_CALLED = "llm_called"
    LLM_RESULT = "llm_result"
    SUB_AGENT_SELECTED = "sub_agent_selected"
    SUB_AGENT_RESULT = "sub_agent_result"
    VERIFICATION_STARTED = "verification_started"
    VERIFICATION_RESULT = "verification_result"
    PERMISSION_REQUESTED = "permission_requested"
    PERMISSION_RESOLVED = "permission_resolved"
    TASK_PAUSED = "task_paused"
    TASK_RESUMED = "task_resumed"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    ERROR = "error"
    INFO = "info"


class EventActor(str, Enum):
    SYSTEM = "system"
    USER = "user"
    AGENT = "agent"
    TOOL = "tool"
    LLM = "llm"


class Event(BaseModel):
    id: str = Field(default_factory=_uid)
    type: EventType
    task_id: str
    step_id: Optional[str] = None
    actor: EventActor = EventActor.SYSTEM
    timestamp: str = ""
    payload: dict[str, Any] = Field(default_factory=dict)
    seq: int = 0
