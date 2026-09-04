"""Core contracts: LLMRequest, LLMResponse, Usage, Provider/Model/CredentialProfile.

Spec: implementation/04-core-contracts.md (4.21-4.23) + 09-llm-gateway.md.
"""
from __future__ import annotations

import uuid
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


def _uid() -> str:
    return str(uuid.uuid4())


class LLMCapability(str, Enum):
    CHAT = "chat"
    COMPLETION = "completion"
    EMBEDDING = "embedding"
    VISION = "vision"
    FUNCTION = "function"


class Message(BaseModel):
    role: str  # system|user|assistant|tool
    content: Any
    name: Optional[str] = None


class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_units: float = 0.0


class LLMRequest(BaseModel):
    id: str = Field(default_factory=_uid)
    provider: Optional[str] = None
    model: Optional[str] = None
    credential_profile: Optional[str] = None
    messages: list[Message] = Field(default_factory=list)
    params: dict[str, Any] = Field(default_factory=dict)
    capability: LLMCapability = LLMCapability.CHAT
    context_refs: list = Field(default_factory=list)
    trace_id: Optional[str] = None


class LLMResponse(BaseModel):
    id: str = Field(default_factory=_uid)
    provider: Optional[str] = None
    model: Optional[str] = None
    profile: Optional[str] = None
    content: Any = None
    usage: Usage = Field(default_factory=Usage)
    latency_ms: int = 0
    status: str = "success"  # success|failure|filtered
    error: Optional[dict[str, Any]] = None


class Provider(BaseModel):
    id: str
    name: str
    kind: str
    base_url: Optional[str] = None
    adapter_ref: str
    capabilities: list[LLMCapability] = Field(default_factory=list)
    status: str = "active"  # active|disabled|error


class Model(BaseModel):
    id: str
    provider_id: str
    name: str
    capability_tags: list[LLMCapability] = Field(default_factory=list)
    context_window: int = 8192
    cost_unit: float = 1.0
    tier: str = "standard"


class QuotaState(BaseModel):
    used: float = 0.0
    limit: float
    window: str = "daily"
    reset_at: Optional[str] = None


class CredentialProfile(BaseModel):
    id: str
    provider_id: str
    key_ref: str  # resolved by Security at call time
    quota: QuotaState
    rate_limit: int = 60  # requests/min
    allowed_models: list[str] = Field(default_factory=list)
    terms_scope: str = "standard"
