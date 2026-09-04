"""Pytest fixtures. Builds the real Runtime against a local SQLite DB (no external infra)."""
import os

os.environ.setdefault("AAP_DATABASE_URL", "sqlite+aiosqlite:///./test_aap.db")

import pytest_asyncio
from app.runtime.runtime import build_runtime


@pytest_asyncio.fixture
async def runtime():
    rt = await build_runtime()
    yield rt
