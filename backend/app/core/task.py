"""Core contracts: Task, Plan, Step, Result, Artifact, ErrorInfo, Ref, Constraint.

Spec: implementation/04-core-contracts.md (sections 4.1-4.12).
All identifiers are UUID strings; timestamps UTC ISO-8601. Enums are closed sets.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid() -> str:
    return str(uuid.uuid4())


class TaskType(str, Enum):
    RESEARCH = "research"
    ANALYSIS = "analysis"
    CODE = "code"
    WRITE = "write"
    DEBUG = "debug"
    FIX = "fix"
    REVIEW = "review"
    TEST = "test"
    BROWSER = "browser"
    FILE = "file"
    VERIFY = "verify"
    SECURITY = "security"
    MIXED = "mixed"
    UNKNOWN = "unknown"


class TaskStatus(str, Enum):
    CREATED = "created"
    PLANNING = "planning"
    EXECUTING = "executing"
    VERIFYING = "verifying"
    PAUSED = "paused"
    FAILED = "failed"
    COMPLETED = "completed"


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    VERIFYING = "verifying"
    AWAITING_PERMISSION = "awaiting_permission"


class RefKind(str, Enum):
    RESULT = "result"
    ARTIFACT = "artifact"
    MEMORY = "memory"
    CONTEXT = "context"


class Ref(BaseModel):
    kind: RefKind
    id: str


class Artifact(BaseModel):
    id: str = Field(default_factory=_uid)
    type: str = "text"  # text|file|image|data|link|code|other
    name: str
    ref: str
    size: Optional[int] = None
    mime: Optional[str] = None
    created_at: str = Field(default_factory=_now)


class ErrorSource(str, Enum):
    LLM = "llm"
    TOOL = "tool"
    AGENT = "agent"
    SYSTEM = "system"
    PROVIDER = "provider"


class ErrorInfo(BaseModel):
    code: str
    message: str
    source: ErrorSource
    retryable: bool = False
    details: Optional[dict[str, Any]] = None


class ResultStatus(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILURE = "failure"


class Result(BaseModel):
    id: str = Field(default_factory=_uid)
    step_id: str
    status: ResultStatus
    artifacts: list[Artifact] = Field(default_factory=list)
    summary: str = ""
    metrics: dict[str, Any] = Field(default_factory=dict)
    error: Optional[ErrorInfo] = None


class ConstraintKind(str, Enum):
    MODEL = "model"
    SUB_AGENT = "sub_agent"
    TOOL = "tool"
    ORDER = "order"
    SCOPE = "scope"
    PERMISSION = "permission"


class Constraint(BaseModel):
    kind: ConstraintKind
    value: str
    enforced: bool = True


class TaskIntent(BaseModel):
    raw: str
    goal: str
    constraints: list[Constraint] = Field(default_factory=list)
    mode: str = "instruction"  # instruction|workspace
    classification: TaskType = TaskType.UNKNOWN


class DependencyKind(str, Enum):
    BLOCKS = "blocks"
    FEEDS = "feeds"


class Dependency(BaseModel):
    from_step: str
    to_step: str
    kind: DependencyKind = DependencyKind.FEEDS


class PlanStrategy(str, Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    MIXED = "mixed"


class Step(BaseModel):
    id: str = Field(default_factory=_uid)
    goal: str
    assigned_agent: Optional[str] = None
    tool_ids: list[str] = Field(default_factory=list)
    input_refs: list[Ref] = Field(default_factory=list)
    status: StepStatus = StepStatus.PENDING
    result: Optional[Result] = None
    retry_count: int = 0
    depends_on: list[str] = Field(default_factory=list)


class Plan(BaseModel):
    id: str = Field(default_factory=_uid)
    steps: list[Step] = Field(default_factory=list)
    edges: list[Dependency] = Field(default_factory=list)
    strategy: PlanStrategy = PlanStrategy.SEQUENTIAL
    verification_points: list[str] = Field(default_factory=list)
    created_by: str = "agent"
    version: int = 1


class Task(BaseModel):
    id: str = Field(default_factory=_uid)
    conversation_id: str
    user_id: str
    intent: TaskIntent
    plan: Plan
    status: TaskStatus = TaskStatus.CREATED
    current_step_id: Optional[str] = None
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)
    final_result: Optional[Result] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
