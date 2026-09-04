"""Security: secrets resolution.

Spec: implementation/17-security.md 17.3. Provider credentials are resolved at Gateway call
time only, from a secret store. Never exposed to frontend, logs, or events. For development
the Fake adapter ignores credentials; real resolvers read from env/secret manager.
"""
from __future__ import annotations

import os
from typing import Callable

from dotenv import load_dotenv

from app.log import get_logger

logger = get_logger("security.secrets")

# Load backend/.env so provider keys land in os.environ (idempotent).
load_dotenv()

CredentialResolver = Callable[[str], dict]


async def env_secret_resolver(key_ref: str) -> dict:
    """Resolve a key_ref to credentials. In dev, fake provider needs no secret."""
    if key_ref == "fake-key":
        return {}
    value = os.environ.get(key_ref.upper().replace("-", "_"), "")
    if not value:
        logger.warning("secret_missing", key_ref=key_ref)
    return {"api_key": value}


def redact(payload: dict) -> dict:
    """Scrub obvious secret keys from logs/events (17.3)."""
    secret_keys = ("api_key", "secret", "token", "password", "key")
    out = dict(payload)
    for k in list(out.keys()):
        if any(s in k.lower() for s in secret_keys):
            out[k] = "***redacted***"
    return out
