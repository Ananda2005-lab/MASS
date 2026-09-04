"""Core contracts: ContextLayer, ContextBundle.

Spec: implementation/04-core-contracts.md (4.25) + 10-memory-context.md (decision 05).
"""
from __future__ import annotations

import uuid
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from app.core.task import Ref


def _uid() -> str:
    return str(uuid.uuid4())


class ContextLayerKind(str, Enum):
    CONVERSATION = "conversation"
    TASK_STATE = "task_state"
    RESULT = "result"
    MEMORY = "memory"
    INSTRUCTION = "instruction"
    TOOL_RESULT = "tool_result"
    AGENT_STATE = "agent_state"


class ContextLayer(BaseModel):
    id: str = Field(default_factory=_uid)
    kind: ContextLayerKind
    source_ref: Ref
    content_ref: str
    tokens: int = 0
    importance: float = 0.5
    created_at: str = ""


class ContextBundle(BaseModel):
    layers: list[ContextLayer] = Field(default_factory=list)
    assembled_at: str = ""
    token_estimate: int = 0
    compressed: bool = False
