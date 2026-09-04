"""Observability: tracing + metrics helpers (implementation/18-observability.md).

Lightweight, no external sink required. Spans recorded in-memory; redaction handled by
Security before logs. Structured JSON logs already in app/log.py.
"""
from __future__ import annotations

import time
import uuid
from contextvars import ContextVar
from dataclasses import dataclass, field

from app.log import get_logger

logger = get_logger("observability.tracing")

_trace_id: ContextVar[str] = ContextVar("trace_id", default="")


@dataclass
class Span:
    name: str
    trace_id: str
    start: float = field(default_factory=time.monotonic)
    end: float = 0.0
    ok: bool = True
    meta: dict = field(default_factory=dict)

    @property
    def duration_ms(self) -> float:
        base = self.end or time.monotonic()
        return (base - self.start) * 1000


class Tracer:
    def span(self, name: str, **meta):
        tid = _trace_id.get() or str(uuid.uuid4())
        token = _trace_id.set(tid)
        s = Span(name=name, trace_id=tid, meta=meta)
        logger.info("span_start", name=name, trace_id=tid, **meta)
        return _SpanCtx(self, s, token)


class _SpanCtx:
    def __init__(self, tracer: Tracer, span: Span, token) -> None:
        self._t = tracer
        self._s = span
        self._token = token

    async def __aenter__(self):
        return self._s

    async def __aexit__(self, exc_type, exc, tb):
        self._s.end = time.monotonic()
        self._s.ok = exc_type is None
        from app.core.llm import Usage
        logger.info("span_end", name=self._s.name, duration_ms=round(self._s.duration_ms, 2), ok=self._s.ok)
        _trace_id.reset(self._token)
        return False


tracer = Tracer()
