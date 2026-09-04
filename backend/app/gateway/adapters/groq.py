"""Groq provider adapter.

Groq exposes an OpenAI-compatible /v1/chat/completions endpoint.
Key rotation: 5 profiles each with its own key_ref and daily quota.
"""
from __future__ import annotations

import time

from app.core.llm import LLMRequest, LLMResponse, Usage
from app.gateway.adapters._http import chat_completion, list_models, parse_chat_response
from app.gateway.provider import ProviderAdapter

BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL = "openai/gpt-oss-120b"
# internal model id (gateway registry) → provider model name
MODEL_NAMES = {
    "groq-gpt-oss-120b": "openai/gpt-oss-120b",
    "groq-gpt-oss-20b": "openai/gpt-oss-20b",
    "groq-qwen-3.8-27b": "qwen/qwen3.8-27b",
    "groq-qwen-3.6-27b": "qwen/qwen3.6-27b",
}
MODEL_COST = {
    "openai/gpt-oss-120b": 0.2,
    "openai/gpt-oss-20b": 0.1,
    "qwen/qwen3.8-27b": 0.1,
    "qwen/qwen3.6-27b": 0.1,
}


class GroqProviderAdapter(ProviderAdapter):
    provider_id: str = "groq"

    async def complete(self, request: LLMRequest, credential: dict) -> LLMResponse:
        api_key = credential.get("api_key")
        if not api_key:
            raise ValueError("missing api_key for groq")
        model = MODEL_NAMES.get(request.model or "", request.model or DEFAULT_MODEL)
        started = time.monotonic()
        raw = await chat_completion(
            base_url=BASE_URL,
            api_key=api_key,
            model=model,
            messages=request.messages,
            params=request.params,
        )
        cost_unit = MODEL_COST.get(model, 0.5)
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
            return await list_models(BASE_URL, "gsk_dummy")
        except Exception:
            return False