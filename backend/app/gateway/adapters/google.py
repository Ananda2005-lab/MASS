"""Google AI Studio provider adapter (OpenAI-compatible endpoint).

Google AI Studio exposes an OpenAI-compatible /v1beta/openai/chat/completions endpoint.
Key rotation: 6 profiles each with its own key_ref and daily quota.
"""
from __future__ import annotations

import time

from app.core.llm import LLMRequest, LLMResponse, Usage
from app.gateway.adapters._http import chat_completion, list_models, parse_chat_response
from app.gateway.provider import ProviderAdapter

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
DEFAULT_MODEL = "gemini-3.6-flash"
MODEL_NAMES = {
    "google-gemini-3.6-flash": "gemini-3.6-flash",
    "google-gemini-2.5-flash": "gemini-2.5-flash",
    "google-gemini-2.5-pro": "gemini-2.5-pro",
    "google-gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
}
MODEL_COST = {
    "gemini-3.6-flash": 0.10,
    "gemini-2.5-flash": 0.075,
    "gemini-2.5-pro": 1.25,
    "gemini-2.5-flash-lite": 0.05,
}


class GoogleAIStudioProviderAdapter(ProviderAdapter):
    provider_id: str = "google-ai-studio"

    async def complete(self, request: LLMRequest, credential: dict) -> LLMResponse:
        api_key = credential.get("api_key")
        if not api_key:
            raise ValueError("missing api_key for google-ai-studio")
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
            return await list_models(BASE_URL, "AQ.Ab8-dummy")
        except Exception:
            return False