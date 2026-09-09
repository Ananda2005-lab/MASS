"""LLM Gateway orchestration: router selection + retry/fallback/cooldown/quota.

Spec: implementation/09-llm-gateway.md 9.4-9.7. Respects quotas/rate limits; no bypass.
Provider SDKs live only in adapters. Credentials are resolved at call time via a resolver
callback (plugged by Security in T16); the Fake adapter ignores credentials.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Awaitable, Callable, Optional

from app.core.llm import CredentialProfile, LLMRequest, LLMResponse, Model, Provider, Usage
from app.exceptions import ProviderError, QuotaExhaustedError
from app.gateway.health_quota import CandidateStateStore
from app.gateway.provider import ProviderRegistry
from app.gateway.router import Router
from app.log import get_logger

logger = get_logger("gateway")

CredentialResolver = Callable[[str], Awaitable[dict]]


@dataclass
class GatewayConfig:
    max_retries: int = 3
    cooldown_seconds: int = 30
    rate_limit_tokens: int = 1  # placeholder for per-profile rate gate


class LLMGateway:
    def __init__(
        self,
        registry: ProviderRegistry,
        models: dict[str, Model],
        profiles: dict[str, CredentialProfile],
        state: Optional[CandidateStateStore] = None,
        credential_resolver: Optional[CredentialResolver] = None,
        default_model: Optional[str] = None,
    ) -> None:
        self.registry = registry
        self.models = models
        self.profiles = profiles
        self.state = state or CandidateStateStore()
        self.router = Router(registry, models, profiles, self.state)
        self.credential_resolver = credential_resolver or (lambda pid: asyncio.sleep(0, result={}))
        self.cfg = GatewayConfig()
        # When request.model is unset, fall back to this single model.
        self.default_model = default_model

    async def complete(self, request: LLMRequest) -> LLMResponse:
        if request.model is None and self.default_model is not None:
            request.model = self.default_model
        ranked = self.router.ranked(request)
        if not ranked:
            raise QuotaExhaustedError(request.credential_profile or "none")

        last_error: Optional[Exception] = None
        for attempt, cand in enumerate(ranked[: max(self.cfg.max_retries, 1)]):
            provider, model, profile = cand.provider, cand.model, cand.profile
            adapter = self.registry.get_adapter(provider.id)
            if adapter is None:
                continue
            try:
                creds = await self.credential_resolver(profile.key_ref)
                resp = await adapter.complete(request, creds)
            except Exception as e:  # adapter failure -> typed, record, cooldown
                last_error = e
                self.state.health_for(provider.id, model.id, profile.id).record(0, ok=False)
                self.state.cooldown_for(provider.id, model.id, profile.id).trigger(
                    self.cfg.cooldown_seconds, str(e)
                )
                logger.warning("provider_failed", provider=provider.id, error=str(e))
                continue

            ok = resp.status == "success"
            self.state.health_for(provider.id, model.id, profile.id).record(resp.latency_ms, ok)
            if ok:
                q = self.state.quota_for(profile.id, profile.quota.limit)
                q.consume(resp.usage.cost_units)
                return resp
            last_error = ProviderError(resp.error.get("message", "provider error") if resp.error else "provider error")
            self.state.cooldown_for(provider.id, model.id, profile.id).trigger(
                self.cfg.cooldown_seconds, "bad response"
            )

        # All candidates failed -> typed failure, no bypass.
        raise ProviderError(
            f"All LLM candidates failed: {last_error}",
            retryable=False,
        )

    async def complete_stream(self, request: LLMRequest):
        """Token-level streaming with failover BEFORE the first chunk only.

        Yields text chunks; once a stream starts it is committed. Non-streaming
        adapters degrade to a single full-text yield.
        """
        if request.model is None and self.default_model is not None:
            request.model = self.default_model
        ranked = self.router.ranked(request)
        if not ranked:
            raise QuotaExhaustedError(request.credential_profile or "none")

        last_error: Optional[Exception] = None
        for cand in ranked[: max(self.cfg.max_retries, 1)]:
            provider, model, profile = cand.provider, cand.model, cand.profile
            adapter = self.registry.get_adapter(provider.id)
            if adapter is None:
                continue
            started = time.monotonic()
            acc: list[str] = []
            try:
                creds = await self.credential_resolver(profile.key_ref)
                if hasattr(adapter, "complete_stream"):
                    gen = adapter.complete_stream(request, creds)
                    first = await anext(gen, None)
                    if first is None:
                        raise ProviderError("empty stream")
                    acc.append(first)
                    yield first
                    async for chunk in gen:
                        acc.append(chunk)
                        yield chunk
                else:
                    resp = await adapter.complete(request, creds)
                    if resp.status != "success":
                        raise ProviderError("bad response")
                    text = str(resp.content)
                    acc.append(text)
                    yield text
            except Exception as e:  # noqa: BLE001 - candidate failed before/during stream
                if acc:
                    raise  # mid-stream: already committed to this candidate
                last_error = e
                self.state.health_for(provider.id, model.id, profile.id).record(0, ok=False)
                self.state.cooldown_for(provider.id, model.id, profile.id).trigger(
                    self.cfg.cooldown_seconds, str(e)
                )
                logger.warning("provider_failed", provider=provider.id, error=str(e))
                continue

            # success bookkeeping
            self.state.health_for(provider.id, model.id, profile.id).record(
                int((time.monotonic() - started) * 1000), True
            )
            q = self.state.quota_for(profile.id, profile.quota.limit)
            q.consume(max(0.1, (sum(len(c) for c in acc) // 4) * 0.001))
            return
        raise ProviderError(f"All LLM candidates failed: {last_error}", retryable=False)
