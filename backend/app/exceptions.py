"""Domain exceptions. All carry structured info for error handling + audit."""
from __future__ import annotations

from typing import Optional

from app.core.task import ErrorSource


class AgentPlatformError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "internal_error",
        source: ErrorSource = ErrorSource.SYSTEM,
        retryable: bool = False,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.source = source
        self.retryable = retryable


class PermissionDeniedError(AgentPlatformError):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, code="permission_denied", source=ErrorSource.SYSTEM)


class QuotaExhaustedError(AgentPlatformError):
    def __init__(self, profile: str):
        super().__init__(
            f"Quota exhausted for profile {profile}",
            code="quota_exhausted",
            source=ErrorSource.PROVIDER,
            retryable=False,
        )


class ProviderError(AgentPlatformError):
    def __init__(self, message: str, retryable: bool = True, provider: Optional[str] = None):
        super().__init__(
            message, code="provider_error", source=ErrorSource.PROVIDER, retryable=retryable
        )
        self.provider = provider


class ToolExecutionError(AgentPlatformError):
    def __init__(self, message: str, retryable: bool = False):
        super().__init__(message, code="tool_error", source=ErrorSource.TOOL, retryable=retryable)


class VerificationFailedError(AgentPlatformError):
    def __init__(self, message: str = "Verification failed"):
        super().__init__(message, code="verification_failed", source=ErrorSource.AGENT)


class TaskStateError(AgentPlatformError):
    def __init__(self, message: str):
        super().__init__(message, code="task_state_error", source=ErrorSource.SYSTEM)
