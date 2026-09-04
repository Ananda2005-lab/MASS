"""Core contract exports. Single import surface for the whole runtime.

Spec: implementation/04-core-contracts.md. Backend pydantic models mirrored as
frontend TS interfaces in frontend/lib/types.ts (implementation/21-ui-blueprint.md 21.2).
"""
from app.core.task import (
    Artifact,
    Constraint,
    ConstraintKind,
    Dependency,
    DependencyKind,
    ErrorInfo,
    ErrorSource,
    Plan,
    PlanStrategy,
    Ref,
    RefKind,
    Result,
    ResultStatus,
    Step,
    StepStatus,
    Task,
    TaskIntent,
    TaskStatus,
    TaskType,
)
from app.core.tool import (
    ErrorHandling,
    ExecutionKind,
    Permission,
    Tool,
    ToolCategory,
    ToolInvocation,
    ToolMetadata,
    ToolResult,
    ToolResultStatus,
)
from app.core.llm import (
    CredentialProfile,
    LLMCapability,
    LLMRequest,
    LLMResponse,
    Message,
    Model,
    Provider,
    QuotaState,
    Usage,
)
from app.core.sub_agent import (
    SubAgentContract,
    SubAgentContext,
    SubAgentResult,
    SubAgentRole,
)
from app.core.event import Event, EventActor, EventType
from app.core.context import ContextBundle, ContextLayer, ContextLayerKind

__all__ = [
    "Artifact", "Constraint", "ConstraintKind", "Dependency", "DependencyKind",
    "ErrorInfo", "ErrorSource", "Plan", "PlanStrategy", "Ref", "RefKind", "Result",
    "ResultStatus", "Step", "StepStatus", "Task", "TaskIntent", "TaskStatus", "TaskType",
    "ErrorHandling", "ExecutionKind", "Permission", "Tool", "ToolCategory",
    "ToolInvocation", "ToolMetadata", "ToolResult", "ToolResultStatus",
    "CredentialProfile", "LLMCapability", "LLMRequest", "LLMResponse", "Message",
    "Model", "Provider", "QuotaState", "Usage",
    "SubAgentContract", "SubAgentContext", "SubAgentResult", "SubAgentRole",
    "Event", "EventActor", "EventType",
    "ContextBundle", "ContextLayer", "ContextLayerKind",
]
