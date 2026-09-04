"""API request/response schemas (contract-shaped, mirror core contracts)."""
from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel


class InstructionBody(BaseModel):
    raw: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = "default-user"
    mode: str = "instruction"


class WorkspaceActionBody(BaseModel):
    task_id: str
    action: str
    payload: dict = {}


class ApproveBody(BaseModel):
    task_id: str
    ticket: str


class ConversationBody(BaseModel):
    user_id: Optional[str] = "default-user"
