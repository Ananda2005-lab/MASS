"""LLM Gateway: provider registry + adapter protocol.

Spec: implementation/09-llm-gateway.md. Gateway is the ONLY module importing provider SDKs.
A FakeProviderAdapter is included so the platform runs end-to-end without real keys (dev/test).
"""
from __future__ import annotations

import abc
from typing import Optional

from app.core.llm import LLMRequest, LLMResponse, Provider


class ProviderAdapter(abc.ABC):
    """Adapter wraps a single provider SDK. Lives only inside app/gateway/adapters."""

    provider_id: str

    @abc.abstractmethod
    async def complete(self, request: LLMRequest, credential: dict) -> LLMResponse:
        ...

    @abc.abstractmethod
    async def is_healthy(self) -> bool:
        ...


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, Provider] = {}
        self._adapters: dict[str, ProviderAdapter] = {}

    def register(self, provider: Provider, adapter: ProviderAdapter) -> None:
        self._providers[provider.id] = provider
        self._adapters[provider.id] = adapter
        adapter.provider_id = provider.id

    def get_provider(self, provider_id: str) -> Optional[Provider]:
        return self._providers.get(provider_id)

    def get_adapter(self, provider_id: str) -> Optional[ProviderAdapter]:
        return self._adapters.get(provider_id)

    def list_providers(self) -> list[Provider]:
        return list(self._providers.values())

    def candidates_for(self, capability: str) -> list[str]:
        out = []
        for p in self._providers.values():
            if any(c.value == capability for c in p.capabilities):
                out.append(p.id)
        return out


registry = ProviderRegistry()
