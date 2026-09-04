"""FastAPI dependency to access the composed Runtime (implementation/15-backend-api.md)."""
from __future__ import annotations

from fastapi import Request

from app.runtime.runtime import Runtime


def get_runtime(request: Request) -> Runtime:
    return request.app.state.runtime
