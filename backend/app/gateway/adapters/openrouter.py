"""OpenRouter provider adapter.

OpenRouter exposes an OpenAI-compatible /v1/chat/completions endpoint.
Key rotation: 5 profiles each with its own key_ref and daily quota.
"""
from __future__ import annotations

import time
from typing import Any

from app.core.llm import LLMRequest, LLMResponse, Usage
from app.gateway.adapters._http import chat_completion, list_models, parse_chat_response
from app.gateway.provider import ProviderAdapter

BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "anthropic/claude-sonnet-4"
MODEL_NAMES = {
    "openrouter-claude-sonnet-4": "anthropic/claude-sonnet-4",
    "openrouter-gpt-5": "openai/gpt-5",
    "openrouter-gpt-4o": "openai/gpt-4o",
    "openrouter-gemini-3.6-flash": "google/gemini-3.6-flash",
    "openrouter-gemini-2.5-flash": "google/gemini-2.5-flash",
    "openrouter-deepseek-chat": "deepseek/deepseek-chat",
    "openrouter-llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
}
MODEL_COST = {
    "anthropic/claude-sonnet-4": 3.0,
    "openai/gpt-5": 2.5,
    "openai/gpt-4o": 2.5,
    "google/gemini-3.6-flash": 0.15,
    "google/gemini-2.5-flash": 0.15,
    "deepseek/deepseek-chat": 0.15,
    "meta-llama/llama-3.3-70b-instruct": 0.35,
    "mistralai/mistral-large": 2.0,
}


class OpenRouterProviderAdapter(ProviderAdapter):
    provider_id: str = "openrouter"

    async def complete(self, request: LLMRequest, credential: dict) -> LLMResponse:
        api_key = credential.get("api_key")
        if not api_key:
            raise ValueError("missing api_key for openrouter")
        model = MODEL_NAMES.get(request.model or "", request.model or DEFAULT_MODEL)
        started = time.monotonic()
        extra = {"HTTP-Referer": "https://rag-v2.local", "X-Title": "RAG-V2"}
        raw = await chat_completion(
            base_url=BASE_URL,
            api_key=api_key,
            model=model,
            messages=request.messages,
            params=request.params,
            extra_headers=extra,
        )
        cost_unit = MODEL_COST.get(model, 1.0)
        parsed = parse_chat_response(raw=raw, provider=self.provider_id, model=model, profile=request.credential_profile, started=started, cost_unit=cost_unit)
        return LLMResponse(
            provider=parsed["provider"],
            model=parsed["model"],
            profile=parsed["profile"],
            content=parsed["content"],
            usage=Usage(**parsed["usage"]),
            latency_ms=parsed["latency_ms"],
            status=parsed["status"],
        )

    async def is_healthy(self) -> bool:
        try:
            return await list_models(BASE_URL, "sk-or-v1-dummy-test")
        except Exception:
            return False