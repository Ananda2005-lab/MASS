"""Event bus: publish/subscribe/replay (implementation/13-task-state-events.md 13.4).

Persists every event to the durable EventRepo (append-only) and fans out to in-memory
realtime subscribers. Realtime layer subscribes; runtime publishes. No business logic here.
"""
from __future__ import annotations

import asyncio
from typing import Callable, Optional

from app.core.event import Event, EventType
from app.core.task import Task
from app.log import get_logger
from app.persistence.repos import EventRepo

logger = get_logger("event_bus")

EventHandler = Callable[[Event], None]


class EventBus:
    def __init__(self, event_repo: EventRepo) -> None:
        self._repo = event_repo
        self._subscribers: dict[str, list[EventHandler]] = {}  # scope -> handlers
        self._seq: dict[str, int] = {}  # task_id -> last seq
        self._lock = asyncio.Lock()

    def subscribe(self, scope: str, handler: EventHandler) -> None:
        self._subscribers.setdefault(scope, []).append(handler)

    def unsubscribe(self, scope: str, handler: EventHandler) -> None:
        if scope in self._subscribers:
            self._subscribers[scope] = [h for h in self._subscribers[scope] if h is not handler]

    async def publish(self, event: Event) -> None:
        async with self._lock:
            event.seq = self._seq.get(event.task_id, 0) + 1
            self._seq[event.task_id] = event.seq
        await self._repo.append(event)
        for scope in (f"task:{event.task_id}", f"conversation:*"):
            for h in self._subscribers.get(scope, []):
                try:
                    h(event)
                except Exception as e:  # subscriber errors must not break publish
                    logger.warning("subscriber_error", error=str(e))

    async def replay(self, task_id: str, since_seq: int = 0) -> list:
        return await self._repo.replay(task_id, since_seq)
