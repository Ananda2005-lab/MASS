"""Memory persistence facade over MemoryRepo.

Spec: Master Project Specification §13 (Memory and Context). This layer owns no
SQL; it delegates all persistence to the repository pattern (app.persistence.repos).
"""
from __future__ import annotations

import uuid
from typing import Optional

from app.persistence.models import MemoryItemRow
from app.persistence.repos import MemoryRepo


class MemoryStore:
    """Thin async store for memory items backed by MemoryRepo."""

    def __init__(self, memory_repo: MemoryRepo) -> None:
        self._repo = memory_repo

    async def save_memory(
        self,
        user_id: str,
        kind: str,
        content: str,
        importance: float = 0.5,
    ) -> None:
        row = MemoryItemRow(
            id=str(uuid.uuid4()),
            user_id=user_id,
            kind=kind,
            content=content,
            importance=importance,
        )
        await self._repo.add(row)

    async def get_important(self, user_id: str) -> list[dict]:
        return await self._repo.list_for_user(user_id)
