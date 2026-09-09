"""Diagnostic: verify .env keys are loaded and a real LLM call succeeds.

Run from the backend/ folder:  python scripts/check_keys.py
Prints: found keys (masked), base URLs, registered providers, then one live
call per provider with model + response snippet.
"""
from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402

load_dotenv()


def mask(value: str) -> str:
    if len(value) <= 8:
        return "***"
    return f"{value[:5]}...{value[-4:]} (len={len(value)})"


async def main() -> int:
    # 1) Which key env vars exist?
    print("== KEYS FOUND IN ENV ==")
    found = 0
    for prefix, slots in (("OPENROUTER_", 8), ("GROQ_", 5), ("GOOGLE_AI_STUDIO_", 6), ("XKIRO_", 8), ("BAI_AI_", 8)):
        bare = prefix.rstrip("_")
        if os.environ.get(bare):
            found += 1
            url = os.environ.get(f"{prefix}BASE_URL", "")
            print(f"  {bare} = {mask(os.environ[bare])}  [provider base_url: {url or '(missing!)'}]")
        for i in range(1, slots + 1):
            v = os.environ.get(f"{prefix}{i}", "")
            if v:
                found += 1
                per_key_url = os.environ.get(f"{prefix}{i}_BASE_URL", "")
                prov_url = os.environ.get(f"{prefix}BASE_URL", "")
                suffix = f"  [base_url: {per_key_url or prov_url or '(missing!)'}]"
                print(f"  {prefix}{i} = {mask(v)}{suffix}")
    if found == 0:
        print("  NONE — .env is not in backend/ folder or names are wrong")
        print("  Expected names: OPENROUTER_1..8, GROQ_1..5, GOOGLE_AI_STUDIO_1..6")
    print(f"  total: {found} key(s)\n")

    # 2) Base URLs in use
    print("== BASE URLs ==")
    for name in ("OPENROUTER_BASE_URL", "GROQ_BASE_URL", "GOOGLE_AI_STUDIO_BASE_URL"):
        print(f"  {name} = {os.environ.get(name, '(default)') or '(empty!)'}")
    print()

    # 3) Registered providers/models
    from app.gateway.bootstrap import build_default_gateway
    from app.core.llm import LLMRequest, Message
    from app.security.secrets import env_secret_resolver

    gw = build_default_gateway()
    gw.credential_resolver = env_secret_resolver  # same wiring as runtime.py L77
    print("== REGISTERED PROVIDERS ==")
    for p in sorted({m.provider_id for m in gw.models.values()}):
        models = [m.id for m in gw.models.values() if m.provider_id == p]
        print(f"  {p}: {len(models)} models -> {models[:4]}")
    print()

    # 4) One live call per provider
    print("== LIVE CALL TEST (1 per provider) ==")
    ok = 0
    for pid in sorted({m.provider_id for m in gw.models.values()}):
        model = next(m for m in gw.models.values() if m.provider_id == pid)
        req = LLMRequest(
            messages=[Message(role="user", content="Reply with exactly: PONG")],
            model=model.id,
            max_tokens=20,
        )
        try:
            resp = await gw.complete(req)
            snippet = str(resp.content)[:80].replace("\n", " ")
            print(f"  [{pid}] OK   model={model.id} resp={snippet!r}")
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  [{pid}] FAIL model={model.id} error={type(exc).__name__}: {str(exc)[:120]}")
    print(f"\nRESULT: {ok}/{len({m.provider_id for m in gw.models.values()})} providers responded")
    return 0


if __name__ == "__main__":
    asyncio.run(main())
