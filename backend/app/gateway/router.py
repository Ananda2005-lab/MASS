"""LLM Router: weighted candidate scoring over (Provider, Model, CredentialProfile).

Spec: implementation/09-llm-gateway.md 9.3 (decision 02). Filter (incl. quota exhaustion)
runs BEFORE scoring, so no provider restriction is bypassed.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

from app.config import settings
from app.core.llm import CredentialProfile, LLMCapability, LLMRequest, Model, Provider
from app.gateway.health_quota import CandidateStateStore
from app.gateway.provider import ProviderRegistry


@dataclass
class Candidate:
    provider: Provider
    model: Model
    profile: CredentialProfile


class Router:
    def __init__(
        self,
        registry: ProviderRegistry,
        models: dict[str, Model],
        profiles: dict[str, CredentialProfile],
        state: CandidateStateStore,
    ) -> None:
        self.registry = registry
        self.models = models
        self.profiles = profiles
        self.state = state
        self.weights = settings.router_weights

    def _eligible(self, request: LLMRequest) -> list[Candidate]:
        out: list[Candidate] = []
        cap = request.capability.value
        provider_ids = (
            [request.provider]
            if request.provider
            else self.registry.candidates_for(cap)
        )
        for pid in provider_ids:
            provider = self.registry.get_provider(pid)
            if not provider or provider.status != "active":
                continue
            if not any(c.value == cap for c in provider.capabilities):
                continue
            models = (
                [self.models[m] for m in [request.model] if m in self.models]
                if request.model
                else [m for m in self.models.values() if m.provider_id == pid]
            )
            for model in models:
                if not any(c.value == cap for c in model.capability_tags):
                    continue
                profiles = (
                    [self.profiles[p] for p in [request.credential_profile] if p in self.profiles]
                    if request.credential_profile
                    else [p for p in self.profiles.values() if p.provider_id == pid]
                )
                for profile in profiles:
                    if profile.allowed_models and model.id not in profile.allowed_models:
                        continue
                    # Quota exhaustion filter (no bypass): exclude before scoring.
                    q = self.state.quota_for(profile.id, profile.quota.limit)
                    if q.exhausted:
                        continue
                    cd = self.state.cooldown_for(pid, model.id, profile.id)
                    if cd.active:
                        continue
                    out.append(Candidate(provider, model, profile))
        return out

    def _score(self, cand: Candidate, request: LLMRequest) -> float:
        w = self.weights
        # capability: exact tier match
        s_cap = 1.0 if cand.model.tier == "standard" else 0.8
        # cost: lower cost -> higher
        s_cost = 1.0 / (1.0 + cand.model.cost_unit)
        # latency: lower avg latency -> higher
        lat = self.state.health_for(cand.provider.id, cand.model.id, cand.profile.id).avg_latency
        s_lat = 1.0 / (1.0 + lat / 1000.0)
        # reliability: success rate
        s_rel = self.state.health_for(cand.provider.id, cand.model.id, cand.profile.id).success_rate
        # constraint: user model preference
        s_con = 1.0 if (request.model and request.model == cand.model.id) else 0.5
        raw = (
            w["capability"] * s_cap
            + w["cost"] * s_cost
            + w["latency"] * s_lat
            + w["reliability"] * s_rel
            + w["constraint"] * s_con
        )
        return raw

    def select(self, request: LLMRequest) -> Optional[tuple[Provider, Model, CredentialProfile]]:
        eligible = self._eligible(request)
        if not eligible:
            return None
        eligible.sort(key=lambda c: self._score(c, request), reverse=True)
        best = eligible[0]
        fallback = eligible[1:] if len(eligible) > 1 else []
        return best.provider, best.model, best.profile

    def ranked(self, request: LLMRequest) -> list[Candidate]:
        eligible = self._eligible(request)
        eligible.sort(key=lambda c: self._score(c, request), reverse=True)
        return eligible
