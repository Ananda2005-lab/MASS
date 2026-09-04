"""Gateway bootstrap. Registers the Fake provider (dev/test) and, when API keys are
present in the environment, real providers (OpenRouter, Groq, Google AI Studio) with
one CredentialProfile per key — the gateway's weighted router + quota/cooldown then
rotates across keys automatically without any bypass of per-key limits.
"""
from __future__ import annotations

import os

from app.core.llm import (
    CredentialProfile,
    LLMCapability,
    Model,
    Provider,
    QuotaState,
)
from app.gateway.adapters.fake import FakeProviderAdapter
from app.gateway.adapters.google import GoogleAIStudioProviderAdapter
from app.gateway.adapters.groq import GroqProviderAdapter
from app.gateway.adapters.openrouter import OpenRouterProviderAdapter
from app.gateway.gateway import LLMGateway
from app.gateway.provider import ProviderRegistry, registry as global_registry

# Daily quota per key (cost units). Kept generous: rotation is failover, not limit-dodging.
DAILY_QUOTA = 200_000.0


def _has_keys(prefix: str) -> bool:
    for i in range(1, 20):
        if os.environ.get(f"{prefix}{i}"):
            return True
    return False


def _register_fake() -> None:
    provider = Provider(
        id="fake",
        name="Fake Provider",
        kind="fake",
        adapter_ref="fake",
        capabilities=[
            LLMCapability.CHAT,
            LLMCapability.COMPLETION,
            LLMCapability.EMBEDDING,
            LLMCapability.FUNCTION,
        ],
    )
    global_registry.register(provider, FakeProviderAdapter())


def _register_openrouter() -> tuple[dict[str, Model], dict[str, CredentialProfile]]:
    models = {
        "openrouter-claude-sonnet-4": Model(
            id="openrouter-claude-sonnet-4",
            provider_id="openrouter",
            name="anthropic/claude-sonnet-4",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION, LLMCapability.COMPLETION],
            context_window=200_000,
            cost_unit=3.0,
            tier="premium",
        ),
        "openrouter-gpt-5": Model(
            id="openrouter-gpt-5",
            provider_id="openrouter",
            name="openai/gpt-5",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION, LLMCapability.VISION],
            context_window=128_000,
            cost_unit=2.5,
            tier="premium",
        ),
        "openrouter-gpt-4o": Model(
            id="openrouter-gpt-4o",
            provider_id="openrouter",
            name="openai/gpt-4o",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION, LLMCapability.VISION],
            context_window=128_000,
            cost_unit=2.5,
            tier="premium",
        ),
        "openrouter-gemini-3.6-flash": Model(
            id="openrouter-gemini-3.6-flash",
            provider_id="openrouter",
            name="google/gemini-3.6-flash",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION],
            context_window=1_000_000,
            cost_unit=0.15,
            tier="standard",
        ),
        "openrouter-gemini-2.5-flash": Model(
            id="openrouter-gemini-2.5-flash",
            provider_id="openrouter",
            name="google/gemini-2.5-flash",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION],
            context_window=1_000_000,
            cost_unit=0.15,
            tier="standard",
        ),
        "openrouter-deepseek-chat": Model(
            id="openrouter-deepseek-chat",
            provider_id="openrouter",
            name="deepseek/deepseek-chat",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION],
            context_window=128_000,
            cost_unit=0.15,
            tier="standard",
        ),
        "openrouter-llama-3.3-70b": Model(
            id="openrouter-llama-3.3-70b",
            provider_id="openrouter",
            name="meta-llama/llama-3.3-70b-instruct",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION],
            context_window=128_000,
            cost_unit=0.35,
            tier="standard",
        ),
    }
    profiles: dict[str, CredentialProfile] = {}
    for i in range(1, 6):
        key_ref = f"openrouter-{i}"
        profiles[f"openrouter-{i}"] = CredentialProfile(
            id=f"openrouter-{i}",
            provider_id="openrouter",
            key_ref=key_ref,
            quota=QuotaState(used=0.0, limit=DAILY_QUOTA, window="daily"),
            rate_limit=60,
            allowed_models=list(models.keys()),
            terms_scope="standard",
        )
    return models, profiles


def _register_groq() -> tuple[dict[str, Model], dict[str, CredentialProfile]]:
    models = {
        "groq-gpt-oss-120b": Model(
            id="groq-gpt-oss-120b",
            provider_id="groq",
            name="openai/gpt-oss-120b",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION],
            context_window=131_072,
            cost_unit=0.2,
            tier="standard",
        ),
        "groq-gpt-oss-20b": Model(
            id="groq-gpt-oss-20b",
            provider_id="groq",
            name="openai/gpt-oss-20b",
            capability_tags=[LLMCapability.CHAT],
            context_window=131_072,
            cost_unit=0.1,
            tier="standard",
        ),
        "groq-qwen-3.8-27b": Model(
            id="groq-qwen-3.8-27b",
            provider_id="groq",
            name="qwen/qwen3.8-27b",
            capability_tags=[LLMCapability.CHAT],
            context_window=131_072,
            cost_unit=0.1,
            tier="standard",
        ),
        "groq-qwen-3.6-27b": Model(
            id="groq-qwen-3.6-27b",
            provider_id="groq",
            name="qwen/qwen3.6-27b",
            capability_tags=[LLMCapability.CHAT],
            context_window=131_072,
            cost_unit=0.1,
            tier="standard",
        ),
    }
    profiles: dict[str, CredentialProfile] = {}
    for i in range(1, 6):
        profiles[f"groq-{i}"] = CredentialProfile(
            id=f"groq-{i}",
            provider_id="groq",
            key_ref=f"groq-{i}",
            quota=QuotaState(used=0.0, limit=DAILY_QUOTA, window="daily"),
            rate_limit=120,
            allowed_models=list(models.keys()),
            terms_scope="standard",
        )
    return models, profiles


def _register_google() -> tuple[dict[str, Model], dict[str, CredentialProfile]]:
    models = {
        "google-gemini-3.6-flash": Model(
            id="google-gemini-3.6-flash",
            provider_id="google-ai-studio",
            name="gemini-3.6-flash",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION, LLMCapability.VISION],
            context_window=1_000_000,
            cost_unit=0.10,
            tier="standard",
        ),
        "google-gemini-2.5-flash": Model(
            id="google-gemini-2.5-flash",
            provider_id="google-ai-studio",
            name="gemini-2.5-flash",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION, LLMCapability.VISION],
            context_window=1_000_000,
            cost_unit=0.075,
            tier="standard",
        ),
        "google-gemini-2.5-pro": Model(
            id="google-gemini-2.5-pro",
            provider_id="google-ai-studio",
            name="gemini-2.5-pro",
            capability_tags=[LLMCapability.CHAT, LLMCapability.FUNCTION, LLMCapability.VISION],
            context_window=2_000_000,
            cost_unit=1.25,
            tier="premium",
        ),
        "google-gemini-2.5-flash-lite": Model(
            id="google-gemini-2.5-flash-lite",
            provider_id="google-ai-studio",
            name="gemini-2.5-flash-lite",
            capability_tags=[LLMCapability.CHAT],
            context_window=1_000_000,
            cost_unit=0.05,
            tier="standard",
        ),
    }
    profiles: dict[str, CredentialProfile] = {}
    for i in range(1, 7):
        profiles[f"google-ai-studio-{i}"] = CredentialProfile(
            id=f"google-ai-studio-{i}",
            provider_id="google-ai-studio",
            key_ref=f"google-ai-studio-{i}",
            quota=QuotaState(used=0.0, limit=DAILY_QUOTA, window="daily"),
            rate_limit=60,
            allowed_models=list(models.keys()),
            terms_scope="standard",
        )
    return models, profiles


def build_default_gateway() -> LLMGateway:
    """Build the gateway with Fake fallback + real providers when keys exist.

    Fake stays registered so tests and keyless dev runs keep working; real
    providers are registered only if at least one matching env key exists.
    """
    _register_fake()

    all_models: dict[str, Model] = {
        "fake-standard": Model(
            id="fake-standard",
            provider_id="fake",
            name="fake-standard",
            capability_tags=[LLMCapability.CHAT, LLMCapability.COMPLETION],
            context_window=8192,
            cost_unit=1.0,
            tier="standard",
        ),
        "fake-embed": Model(
            id="fake-embed",
            provider_id="fake",
            name="fake-embed",
            capability_tags=[LLMCapability.EMBEDDING],
            context_window=2048,
            cost_unit=0.5,
            tier="standard",
        ),
    }
    all_profiles: dict[str, CredentialProfile] = {
        "fake-default": CredentialProfile(
            id="fake-default",
            provider_id="fake",
            key_ref="fake-key",
            quota=QuotaState(limit=float("inf"), window="unlimited"),
            allowed_models=["fake-standard", "fake-embed"],
        )
    }

    if _has_keys("OPENROUTER_"):
        openrouter = Provider(
            id="openrouter",
            name="OpenRouter",
            kind="llm",
            adapter_ref="openrouter",
            capabilities=[LLMCapability.CHAT, LLMCapability.COMPLETION, LLMCapability.VISION, LLMCapability.FUNCTION],
        )
        global_registry.register(openrouter, OpenRouterProviderAdapter())
        m, p = _register_openrouter()
        all_models.update(m)
        all_profiles.update(p)

    if _has_keys("GROQ_"):
        groq = Provider(
            id="groq",
            name="Groq",
            kind="llm",
            adapter_ref="groq",
            capabilities=[LLMCapability.CHAT, LLMCapability.COMPLETION, LLMCapability.FUNCTION],
        )
        global_registry.register(groq, GroqProviderAdapter())
        m, p = _register_groq()
        all_models.update(m)
        all_profiles.update(p)

    if _has_keys("GOOGLE_AI_STUDIO_"):
        google = Provider(
            id="google-ai-studio",
            name="Google AI Studio",
            kind="llm",
            adapter_ref="google-ai-studio",
            capabilities=[LLMCapability.CHAT, LLMCapability.COMPLETION, LLMCapability.VISION, LLMCapability.FUNCTION],
        )
        global_registry.register(google, GoogleAIStudioProviderAdapter())
        m, p = _register_google()
        all_models.update(m)
        all_profiles.update(p)

    return LLMGateway(global_registry, all_models, all_profiles, default_model="groq-gpt-oss-120b")