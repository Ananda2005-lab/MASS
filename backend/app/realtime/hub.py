"""Realtime hub: bridges EventBus to connected clients (implementation/14-realtime.md).

Hybrid: WebSocket primary (bidirectional), SSE secondary (read-only). Same Event envelope.
Realtime layer holds NO business logic; it subscribes to the bus and forwards events.
"""
from __future__ import annotations

import asyncio
from typing import Awaitable, Callable

from app.core.event import Event
from app.state.event_bus import EventBus

SendCb = Callable[[dict], Awaitable[None]]


class RealtimeHub:
    def __init__(self, event_bus: EventBus) -> None:
        self._bus = event_bus

    def connect(self, task_id: str, send: SendCb):
        scope = f"task:{task_id}"

        def handler(event: Event) -> None:
            asyncio.create_task(send(event.model_dump()))

        self._bus.subscribe(scope, handler)
        return lambda: self._bus.unsubscribe(scope, handler)
