"""Core contracts: SubAgentContract, SubAgentContext, SubAgentResult.

Spec: implementation/04-core-contracts.md (4.18-4.20) + 08-sub-agent-implementation.md (decision 04).
All 14 runtime sub-agents share one SubAgentContract. Sub-agents are managed, not independent.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.task import Ref, ResultStatus
from app.core.llm import LLMCapability


class SubAgentRole(str, Enum):
    RESEARCH = "research"
    DEEP_READING = "deep_reading"
    ANALYSIS = "analysis"
    PLANNING = "planning"
    CODING = "coding"
    WRITING = "writing"
    DEBUG = "debug"
    FIX = "fix"
    REVIEW = "review"
    TESTING = "testing"
    BROWSER = "browser"
    FILE = "file"
    VERIFICATION = "verification"
    SECURITY = "security"


class SubAgentContract(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    role: SubAgentRole
    input_schema: dict = Field(default_factory=dict)
    output_schema: dict = Field(default_factory=dict)
    capabilities: list[str] = Field(default_factory=list)  # allowed tool ids
    model_preferences: list[str] = Field(default_factory=list)
    max_retries: int = 2
    verification_aware: bool = True
    fallback_role: Optional[SubAgentRole] = None


class SubAgentContext(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    task_id: str
    step_id: str
    goal: str
    inputs: list[Ref] = Field(default_factory=list)
    memory: dict = Field(default_factory=dict)  # ContextBundle as dict
    tools: list = Field(default_factory=list)
    model_hint: Optional[str] = None
    constraints: list = Field(default_factory=list)


class SubAgentResult(BaseModel):
    role: SubAgentRole
    status: ResultStatus
    output: dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""  # REQUIRED: contextual reasoning (Phase 1 §8)
    artifacts: list = Field(default_factory=list)
    verification: Optional[dict] = None
    error: Optional[dict[str, Any]] = None
