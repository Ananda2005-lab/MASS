"""Fake provider adapter — enables end-to-end runs without real credentials.

Spec: implementation/09-llm-gateway.md 9.8 (adapter isolation) + 22-testing.md 22.3 (fakes).
This is the ONLY adapter shipped by default; real adapters are added via config/operators.
It never contacts a network and never requires a secret.
"""
from __future__ import annotations

import asyncio
import json
from typing import Optional

from app.core.llm import LLMCapability, LLMRequest, LLMResponse, Usage
from app.gateway.provider import ProviderAdapter


class FakeProviderAdapter(ProviderAdapter):
    provider_id: str = "fake"

    def __init__(self, latency_ms: int = 20) -> None:
        self._latency_ms = latency_ms

    async def complete(self, request: LLMRequest, credential: dict) -> LLMResponse:
        await asyncio.sleep(self._latency_ms / 1000.0)
        # Deterministic echo-style response so tests/flows are reproducible.
        last = request.messages[-1].content if request.messages else ""
        # Step 1: deterministic tool-call decision (no real provider, no network).
        tool_call = (request.params or {}).get("tool_call")
        if tool_call is not None:
            content = {"role": "assistant", "content": {"tool_call": tool_call}}
        elif request.capability == LLMCapability.EMBEDDING:
            content = [0.0] * 8
        else:
            content = {
                "role": "assistant",
                "content": f"[fake:{self.provider_id}] {last}",
            }
        prompt_tokens = max(1, len(json.dumps([m.model_dump() for m in request.messages], default=str)) // 4)
        completion_tokens = max(1, len(str(content)) // 4)
        return LLMResponse(
            provider=self.provider_id,
            model=request.model or "fake-model",
            profile=request.credential_profile,
            content=content,
            usage=Usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                cost_units=0.0,
            ),
            latency_ms=self._latency_ms,
            status="success",
        )

    async def is_healthy(self) -> bool:
        return True
