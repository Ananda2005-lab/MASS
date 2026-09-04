"""T4 — LLM Gateway weighted routing, filtering, fallback, cooldown, quota (decision 02 / 09)."""
import asyncio
import pytest
from app.core.llm import (
    CredentialProfile, LLMCapability, LLMRequest, Model, Provider, QuotaState,
)
from app.gateway.provider import ProviderRegistry, ProviderAdapter
from app.gateway.router import Router
from app.gateway.gateway import LLMGateway
from app.gateway.health_quota import CandidateStateStore


class LocalAdapter(ProviderAdapter):
    def __init__(self, pid, fail=False):
        self.provider_id = pid
        self._fail = fail

    async def complete(self, request, credential):
        if self._fail:
            raise RuntimeError("boom")
        return type("R", (), {"provider": self.provider_id, "model": request.model,
                              "profile": request.credential_profile, "content": "ok",
                              "usage": type("U", (), {"cost_units": 1.0, "total_tokens": 2})(),
                              "latency_ms": 10, "status": "success", "error": None})()

    async def is_healthy(self):
        return not self._fail


def _build(fail_good=False):
    reg = ProviderRegistry()
    reg.register(Provider(id="p_good", name="g", kind="x", adapter_ref="a",
                          capabilities=[LLMCapability.CHAT, LLMCapability.COMPLETION]),
                 LocalAdapter("p_good", fail=fail_good))
    reg.register(Provider(id="p_bad", name="b", kind="x", adapter_ref="a",
                          capabilities=[LLMCapability.CHAT]),
                 LocalAdapter("p_bad", fail=False))
    models = {
        "good-std": Model(id="good-std", provider_id="p_good", name="s", capability_tags=[LLMCapability.CHAT], cost_unit=1.0),
        "good-cheap": Model(id="good-cheap", provider_id="p_good", name="c", capability_tags=[LLMCapability.CHAT], cost_unit=0.5),
        "bad-std": Model(id="bad-std", provider_id="p_bad", name="s", capability_tags=[LLMCapability.CHAT], cost_unit=1.0),
    }
    profiles = {
        "pg": CredentialProfile(id="pg", provider_id="p_good", key_ref="k", quota=QuotaState(limit=float("inf"))),
        "pb": CredentialProfile(id="pb", provider_id="p_bad", key_ref="k", quota=QuotaState(limit=float("inf"))),
    }
    gw = LLMGateway(reg, models, profiles, CandidateStateStore(), credential_resolver=lambda pid: asyncio.sleep(0, result={}))
    return gw


def test_capability_filtering():
    gw = _build()
    assert gw.router.ranked(LLMRequest(capability=LLMCapability.EMBEDDING)) == []


def test_eligibility_and_cost_priority():
    gw = _build()
    cand = gw.router.ranked(LLMRequest(capability=LLMCapability.CHAT))
    ids = [c.model.id for c in cand]
    assert "good-cheap" in ids and "good-std" in ids and "bad-std" in ids
    assert ids.index("good-cheap") < ids.index("good-std")


@pytest.mark.asyncio
async def test_quota_exhaustion_excludes_candidate():
    gw = _build()
    gw.profiles["pg"].quota = QuotaState(limit=0.0)
    gw.profiles["pb"].quota = QuotaState(limit=0.0)
    assert gw.router.ranked(LLMRequest(capability=LLMCapability.CHAT)) == []
    from app.exceptions import QuotaExhaustedError
    with pytest.raises(QuotaExhaustedError):
        await gw.complete(LLMRequest(capability=LLMCapability.CHAT))


@pytest.mark.asyncio
async def test_fallback_on_provider_failure():
    gw = _build(fail_good=True)
    resp = await gw.complete(LLMRequest(capability=LLMCapability.CHAT))
    assert resp.provider == "p_bad"


@pytest.mark.asyncio
async def test_cooldown_excludes_after_failure():
    gw = _build(fail_good=True)
    await gw.complete(LLMRequest(capability=LLMCapability.CHAT))
    ids = [c.model.id for c in gw.router.ranked(LLMRequest(capability=LLMCapability.CHAT))]
    assert not any(i.startswith("good") for i in ids)


@pytest.mark.asyncio
async def test_transient_retry_exhausts_then_fails():
    reg = ProviderRegistry()
    reg.register(Provider(id="p", name="p", kind="x", adapter_ref="a", capabilities=[LLMCapability.CHAT]),
                 LocalAdapter("p", fail=True))
    models = {"m": Model(id="m", provider_id="p", name="m", capability_tags=[LLMCapability.CHAT])}
    profiles = {"p": CredentialProfile(id="p", provider_id="p", key_ref="k", quota=QuotaState(limit=float("inf")))}
    gw = LLMGateway(reg, models, profiles, CandidateStateStore(), credential_resolver=lambda pid: asyncio.sleep(0, result={}))
    from app.exceptions import ProviderError
    with pytest.raises(ProviderError):
        await gw.complete(LLMRequest(capability=LLMCapability.CHAT))
