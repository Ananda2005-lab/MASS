"""Health, quota, cooldown state for LLM candidates.

Spec: implementation/09-llm-gateway.md 9.6 (decision 02). No provider restriction bypass:
exhausted quotas are excluded by the Router filter BEFORE scoring.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class HealthState:
    success_count: int = 0
    failure_count: int = 0
    last_latency_ms: float = 0.0
    rolling_latencies: list = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.failure_count
        return (self.success_count / total) if total else 1.0

    @property
    def avg_latency(self) -> float:
        return (sum(self.rolling_latencies) / len(self.rolling_latencies)) if self.rolling_latencies else 0.0

    def record(self, latency_ms: float, ok: bool) -> None:
        if ok:
            self.success_count += 1
        else:
            self.failure_count += 1
        self.last_latency_ms = latency_ms
        self.rolling_latencies.append(latency_ms)
        if len(self.rolling_latencies) > 20:
            self.rolling_latencies.pop(0)


@dataclass
class CooldownState:
    until: float = 0.0
    reason: str = ""

    @property
    def active(self) -> bool:
        return time.time() < self.until

    def trigger(self, seconds: int, reason: str) -> None:
        self.until = time.time() + seconds
        self.reason = reason


@dataclass
class QuotaTracker:
    used: float = 0.0
    limit: float = float("inf")
    window: str = "daily"
    reset_at: float = 0.0

    @property
    def exhausted(self) -> bool:
        return self.used >= self.limit

    def consume(self, units: float) -> None:
        self.used += units

    def reset_if_due(self) -> None:
        if self.reset_at and time.time() >= self.reset_at and self.limit != float("inf"):
            self.used = 0.0


class CandidateStateStore:
    """Per (provider, model, profile) runtime state."""

    def __init__(self) -> None:
        self.health: dict[str, HealthState] = {}
        self.cooldown: dict[str, CooldownState] = {}
        self.quota: dict[str, QuotaTracker] = {}

    def _key(self, provider: str, model: str, profile: str) -> str:
        return f"{provider}|{model}|{profile}"

    def health_for(self, provider: str, model: str, profile: str) -> HealthState:
        k = self._key(provider, model, profile)
        return self.health.setdefault(k, HealthState())

    def cooldown_for(self, provider: str, model: str, profile: str) -> CooldownState:
        k = self._key(provider, model, profile)
        return self.cooldown.setdefault(k, CooldownState())

    def quota_for(self, profile: str, limit: float = float("inf")) -> QuotaTracker:
        q = self.quota.setdefault(profile, QuotaTracker(limit=limit))
        q.reset_if_due()
        return q
