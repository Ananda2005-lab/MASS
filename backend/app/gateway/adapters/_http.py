"""Shared HTTP chat-completion client for OpenAI-compatible providers.

OpenRouter, Groq, and Google AI Studio all expose an OpenAI-compatible
/v1/chat/completions endpoint. This module keeps the wire format in one place.
Only adapters import this (spec: SDK confinement to app/gateway/adapters).
"""
from __future__ import annotations

import json
import time
from typing import Any, Optional

import httpx

from app.core.llm import Message

TIMEOUT_SECONDS = 60.0


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def to_openai_messages(messages: list[Message]) -> list[dict[str, Any]]:
    """Translate internal Message list to OpenAI-compatible payload."""
    out: list[dict[str, Any]] = []
    for m in messages:
        if m.role == "tool":
            out.append({"role": "tool", "content": str(m.content), "tool_call_id": m.name or ""})
        elif m.role == "assistant" and isinstance(m.content, dict):
            out.append({"role": "assistant", "content": m.content.get("content") or ""})
        else:
            out.append({"role": m.role, "content": m.content})
    return out


def _extract_text(choice: dict[str, Any]) -> str:
    msg = choice.get("message") or {}
    content = msg.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for c in content:
            if isinstance(c, dict) and c.get("type") == "text":
                parts.append(c.get("text", ""))
        return "".join(parts)
    return str(content or "")


async def chat_completion(
    *,
    base_url: str,
    api_key: str,
    model: str,
    messages: list[Message],
    params: dict[str, Any],
    extra_headers: Optional[dict[str, str]] = None,
) -> dict[str, Any]:
    """POST {base_url}/chat/completions and return the parsed JSON body.

    Raises httpx.HTTPStatusError on non-2xx (gateway cooldowns the candidate).
    """
    payload: dict[str, Any] = {
        "model": model,
        "messages": to_openai_messages(messages),
        "temperature": params.get("temperature", 0.3),
        "max_tokens": params.get("max_tokens", 4096),
    }
    if params.get("top_p") is not None:
        payload["top_p"] = params["top_p"]
    if params.get("stop"):
        payload["stop"] = params["stop"]
    if params.get("response_format"):
        payload["response_format"] = params["response_format"]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        resp = await client.post(f"{base_url}/chat/completions", json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def list_models(base_url: str, api_key: str) -> bool:
    """Cheap health probe: GET /models with the key. Returns True on 200."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{base_url}/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            return resp.status_code == 200
    except Exception:
        return False


def parse_chat_response(
    *,
    raw: dict[str, Any],
    provider: str,
    model: str,
    profile: Optional[str],
    started: float,
    cost_unit: float,
) -> Any:
    """Parse an OpenAI-compatible response into internal LLMResponse (duck-typed shape).

    Returns a dict-shaped object consumed by the gateway/router (same contract as
    tests use). Cost = tokens * cost_unit scaled to 1e-6 units for quota math.
    """
    usage = raw.get("usage") or {}
    prompt_tokens = int(usage.get("prompt_tokens") or _estimate_tokens(json.dumps(raw)[:2000]))
    completion_tokens = int(usage.get("completion_tokens") or 0)
    total_tokens = int(usage.get("total_tokens") or (prompt_tokens + completion_tokens))
    latency_ms = int((time.monotonic() - started) * 1000)

    choices = raw.get("choices") or []
    text = _extract_text(choices[0]) if choices else ""

    content = {"role": "assistant", "content": text}
    return {
        "provider": provider,
        "model": model,
        "profile": profile,
        "content": content,
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "cost_units": round(total_tokens * cost_unit / 1_000_000, 6),
        },
        "latency_ms": latency_ms,
        "status": "success",
        "error": None,
    }