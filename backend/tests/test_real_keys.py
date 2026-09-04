"""Quick real-API smoke test: calls each provider adapter with the actual
.env keys to verify connectivity, auth, and response parsing.
Run: python -m tests.test_real_keys
"""
from __future__ import annotations

import asyncio
import os
import sys

# Ensure app can be imported when running from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from app.core.llm import LLMRequest, Message
from app.gateway.adapters._http import chat_completion
from app.gateway.adapters.openrouter import OpenRouterProviderAdapter
from app.gateway.adapters.groq import GroqProviderAdapter
from app.gateway.adapters.google import GoogleAIStudioProviderAdapter
from app.gateway.gateway import LLMGateway
from app.gateway.bootstrap import build_default_gateway

MSG = [Message(role="user", content="Reply with exactly one word: hello")]


async def test_provider(name: str, adapter, key: str, model: str):
    print(f"\n── {name} ──")
    if not key:
        print(f"  SKIP  (no key)")
        return
    try:
        resp = await adapter.complete(
            LLMRequest(messages=MSG, model=model, credential_profile=f"{name}-test"),
            {"api_key": key},
        )
        print(f"  OK  {resp.status} | {resp.model} | tokens={resp.usage.total_tokens} | cost={resp.usage.cost_units}")
        if isinstance(resp.content, dict):
            print(f"  out: {str(resp.content.get('content', ''))[:80]}")
        else:
            print(f"  out: {str(resp.content)[:80]}")
    except Exception as e:
        print(f"  FAIL  {type(e).__name__}: {str(e)[:120]}")


async def main():
    print("=== REAL-KEY SMOKE TEST ===")

    or_keys = [os.environ.get(f"OPENROUTER_{i}") for i in range(1, 4)]
    groq_keys = [os.environ.get(f"GROQ_{i}") for i in range(1, 4)]
    google_keys = [os.environ.get(f"GOOGLE_AI_STUDIO_{i}") for i in range(1, 4)]

    or_adapter = OpenRouterProviderAdapter()
    groq_adapter = GroqProviderAdapter()
    google_adapter = GoogleAIStudioProviderAdapter()

    # OpenRouter — 1 model, 3 keys
    for i, k in enumerate(or_keys, 1):
        await test_provider(f"openrouter-{i}", or_adapter, k, "anthropic/claude-sonnet-4")

    # Groq — 1 model, 3 keys
    for i, k in enumerate(groq_keys, 1):
        await test_provider(f"groq-{i}", groq_adapter, k, "openai/gpt-oss-120b")

    # Google — 1 model, 3 keys
    for i, k in enumerate(google_keys, 1):
        await test_provider(f"google-ai-studio-{i}", google_adapter, k, "gemini-3.6-flash")

    # Gateway integration test — build full gateway, route through it
    print("\n── Gateway integration ──")
    try:
        gw = build_default_gateway()
        resp = await gw.complete(LLMRequest(messages=MSG, model="fake-standard"))
        print(f"OK  fake fallback: {resp.status} | {resp.model}")
    except Exception as e:
        print(f"FAIL  {e}")

    print("\n=== DONE ===")


if __name__ == "__main__":
    asyncio.run(main())