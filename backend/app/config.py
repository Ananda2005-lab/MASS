"""Application configuration.

Operator-scoped config (Master Spec §13, §15). Loaded from environment + optional
config/ files. Secrets are referenced by key_ref only (resolved by Security at call time).
No provider keys are read here directly.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="AAP_", env_file=".env", extra="ignore")

    # Service
    app_name: str = "AI Agent Platform"
    environment: str = "development"
    log_level: str = "info"

    # Persistence (PostgreSQL locked; SQLite allowed for local/dev via config)
    database_url: str = "sqlite+aiosqlite:///./aap.db"
    redis_url: str = "redis://localhost:6379/0"

    # Realtime
    websocket_enabled: bool = True
    sse_enabled: bool = True

    # LLM gateway
    gateway_default_capability: str = "chat"
    router_weights: dict = {
        "capability": 0.30,
        "cost": 0.20,
        "latency": 0.20,
        "reliability": 0.20,
        "constraint": 0.10,
    }
    provider_config_path: str = "config/providers.yaml"

    # Context
    context_token_threshold_ratio: float = 0.70

    # Recovery
    max_total_recovery_attempts: int = 12

    # Security
    auth_secret: str = "dev-secret-change-me"
    token_ttl_seconds: int = 3600
    sandbox_enabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
