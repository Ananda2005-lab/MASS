"""Security: authentication tokens.

Spec: implementation/17-security.md 17.1. Token-based auth for API + Realtime. Provider keys
are NEVER issued to clients; only short-lived auth tokens (17.3).
"""
from __future__ import annotations

import hmac
import json
import time
from dataclasses import dataclass
from typing import Optional

from app.config import settings
from app.exceptions import PermissionDeniedError


@dataclass
class AuthToken:
    user_id: str
    scopes: list[str]
    exp: int


def create_token(user_id: str, scopes: Optional[list[str]] = None) -> str:
    payload = AuthToken(user_id=user_id, scopes=scopes or ["task:own"], exp=int(time.time()) + settings.token_ttl_seconds)
    body = json.dumps(payload.__dict__)
    sig = hmac.new(settings.auth_secret.encode(), body.encode(), "sha256").hexdigest()
    return f"{body}.{sig}"


def verify_token(token: str) -> AuthToken:
    try:
        body, sig = token.split(".", 1)
    except ValueError:
        raise PermissionDeniedError("malformed token")
    expected = hmac.new(settings.auth_secret.encode(), body.encode(), "sha256").hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise PermissionDeniedError("bad signature")
    data = json.loads(body)
    if data["exp"] < int(time.time()):
        raise PermissionDeniedError("expired token")
    return AuthToken(**data)


def authorize_access(token: AuthToken, owner_user_id: str) -> None:
    """User may only access own conversations/tasks (17.1)."""
    if token.user_id != owner_user_id:
        raise PermissionDeniedError("not owner")
