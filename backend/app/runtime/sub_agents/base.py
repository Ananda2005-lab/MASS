"""Shared reasoning helper for managed sub-agents.

Spec: Phase 1 §10 (LLM Gateway abstraction). Sub-agents MUST NOT call provider
SDKs directly; all model access flows through `gateway.complete`. This helper
keeps that boundary and degrades gracefully so the planning-phase Fake gateway
produces deterministic, runnable results.
"""
from __future__ import annotations

from app.core.llm import LLMCapability, LLMRequest, Message
from app.log import get_logger

logger = get_logger("sub_agent.base")


async def reason_via_llm(
    gateway,
    prompt: str,
    capability: LLMCapability = LLMCapability.CHAT,
) -> str:
    """Generate substantive content through the gateway and return plain text.

    Handles dict or str `content` shapes. On any failure it returns the echoed
    prompt so callers remain deterministic and never raise unexpectedly.
    """
    try:
        request = LLMRequest(
            capability=capability,
            messages=[Message(role="user", content=prompt)],
        )
        response = await gateway.complete(request)
        content = response.content
        if isinstance(content, dict):
            text = content.get("content")
            if text is None:
                text = content.get("text")
            return text if isinstance(text, str) else str(content)
        if isinstance(content, str):
            return content
        return str(content) if content is not None else prompt
    except Exception as exc:  # noqa: BLE001 - resilient fallback for planning phase
        logger.warning("reason_via_llm_failed", error=str(exc))
        return prompt
