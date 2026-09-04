"""T11 — Security: auth boundaries, permission, secret isolation."""
import pytest
from app.security.auth import create_token, verify_token, authorize_access, AuthToken
from app.security.permissions import PermissionChecker, denied_result
from app.security.secrets import env_secret_resolver, redact
from app.core.tool import ToolInvocation, Permission, Tool, ToolMetadata, ToolCategory, ToolResultStatus


def test_token_roundtrip():
    tok = create_token("user-1")
    assert verify_token(tok).user_id == "user-1"


def test_forged_token_rejected():
    with pytest.raises(Exception):
        verify_token("not.a.valid.token")


def test_owner_authorization():
    tok = AuthToken(user_id="u1", scopes=[], exp=0)
    authorize_access(tok, "u1")
    import pytest
    from app.exceptions import PermissionDeniedError
    with pytest.raises(PermissionDeniedError):
        authorize_access(tok, "other")


@pytest.mark.asyncio
async def test_permission_checker_destructive_requires_ticket():
    pc = PermissionChecker()
    inv = ToolInvocation(tool_id="files.write", params={})
    perm = [Permission(name="fs:write")]
    assert await pc.check(perm, inv) is False
    pc.approve("ticket-1")
    inv.permission_ticket = "ticket-1"
    assert await pc.check(perm, inv) is True


@pytest.mark.asyncio
async def test_non_destructive_no_ticket_needed():
    pc = PermissionChecker()
    inv = ToolInvocation(tool_id="calculator.eval", params={})
    assert await pc.check([Permission(name="none")], inv) is True


@pytest.mark.asyncio
async def test_secret_resolver_fake_needs_no_key():
    assert await env_secret_resolver("fake-key") == {}


def test_no_secret_leak_in_denied_result():
    inv = ToolInvocation(tool_id="x", params={})
    r = denied_result(inv, "denied")
    assert r.status == ToolResultStatus.PERMISSION_DENIED
