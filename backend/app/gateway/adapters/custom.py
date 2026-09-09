"""Generic OpenAI-compatible adapter for third-party proxies (xkiro, b.ai, ...).

Activated only when a base URL is configured in .env (e.g. XKIRO_BASE_URL) and
at least one key exists (XKIRO_1..8 or the bare name XKIRO). Uses the same
model naming as OpenRouter, so proxies reselling OpenRouter access work
without changes. Per-key base URL override (<KEY>_BASE_URL) is honored too.
"""
from __future__ import annotations

import time

from app.core.llm import LLMRequest, LLMResponse, Usage
from app.gateway.adapters._http import chat_completion, chat_completion_stream, parse_chat_response
from app.gateway.provider import ProviderAdapter

# Provider model name table (OpenRouter-compatible naming)
MODEL_NAMES = {
    "claude-sonnet-4": "anthropic/claude-sonnet-4",
    "gpt-5": "openai/gpt-5",
    "gpt-4o": "openai/gpt-4o",
    "gemini-3.6-flash": "google/gemini-3.6-flash",
    "gemini-2.5-flash": "google/gemini-2.5-flash",
    "deepseek-chat": "deepseek/deepseek-chat",
    "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
}
MODEL_COST = {
    "anthropic/claude-sonnet-4": 3.0,
    "openai/gpt-5": 2.5,
    "openai/gpt-4o": 2.5,
    "google/gemini-3.6-flash": 0.15,
    "google/gemini-2.5-flash": 0.15,
    "deepseek/deepseek-chat": 0.15,
    "meta-llama/llama-3.3-70b-instruct": 0.35,
}


class OpenAICompatAdapter(ProviderAdapter):
    provider_id: str = "custom"

    def __init__(self, base_url: str) -> None:
        self._base = base_url.rstrip("/")

    async def complete(self, request: LLMRequest, credential: dict) -> LLMResponse:
        api_key = credential.get("api_key")
        if not api_key:
            raise ValueError(f"missing api_key for {self.provider_id}")
        base = credential.get("base_url") or self._base
        model = MODEL_NAMES.get(request.model or "", request.model or "anthropic/claude-sonnet-4")
        started = time.monotonic()
        raw = await chat_completion(
            base_url=base,
            api_key=api_key,
            model=model,
            messages=request.messages,
            params=request.params,
        )
        parsed = parse_chat_response(
            raw=raw,
            provider=self.provider_id,
            model=model,
            profile=request.credential_profile,
            started=started,
            cost_unit=MODEL_COST.get(model, 1.0),
        )
        return LLMResponse(
            provider=parsed["provider"],
            model=parsed["model"],
            profile=parsed["profile"],
            content=parsed["content"],
            usage=Usage(**parsed["usage"]),
            latency_ms=parsed["latency_ms"],
            status=parsed["status"],
        )

    async def complete_stream(self, request: LLMRequest, credential: dict):
        api_key = credential.get("api_key")
        if not api_key:
            raise ValueError(f"missing api_key for {self.provider_id}")
        base = credential.get("base_url") or self._base
        model = MODEL_NAMES.get(request.model or "", request.model or "anthropic/claude-sonnet-4")
        async for chunk in chat_completion_stream(
            base_url=base, api_key=api_key, model=model,
            messages=request.messages, params=request.params,
        ):
            yield chunk

    async def is_healthy(self) -> bool:
        return True  # best effort; real health is proven by live calls
