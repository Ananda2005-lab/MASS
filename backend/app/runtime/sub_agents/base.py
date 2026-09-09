"""Shared reasoning helper for managed sub-agents — QUALITY ENGINEERING LAYER.

Spec: Phase 1 §10 (LLM Gateway abstraction). Sub-agents MUST NOT call provider
SDKs directly; all model access flows through `gateway.complete`. This module
adds the quality layer on top:

  1. OUTPUT CONTRACTS  — per-role format + quality bar appended to every prompt
  6. TASK→MODEL ROUTING— preferred_contains hints (strong models for heavy work)
  7. PER-ROLE PARAMS   — temperature / max_tokens dialed per role
  8. PARSING HARDENING — extract_code / safe_json for any provider's raw output
  3. AGENTIC TOOL LOOP — reason → optional tool call → observe → final reasoning
"""
from __future__ import annotations

import json
import re
from contextvars import ContextVar
from typing import Any, Callable, Optional

from app.config import settings
from app.core.llm import LLMCapability, LLMRequest, Message
from app.log import get_logger

logger = get_logger("sub_agent.base")

_ROLE_RE = re.compile(r"You are an? (\w+) sub-agent", re.I)

# async-safe sink: executor sets a per-step token emitter; reason_* streams into it
_step_emit: ContextVar[Optional[Callable[[str], None]]] = ContextVar("step_emit", default=None)


def set_step_emit(fn: Optional[Callable[[str], None]]):
    return _step_emit.set(fn)


def _role_of(prompt: str) -> str:
    m = _ROLE_RE.search(prompt or "")
    return m.group(1).lower() if m else ""


# ── 7. per-role generation params ──────────────────────────────────────────── #
_ROLE_PARAMS: dict[str, dict[str, Any]] = {
    "coding": {"temperature": 0.2, "max_tokens": 6000},
    "debug": {"temperature": 0.2, "max_tokens": 5000},
    "fix": {"temperature": 0.2, "max_tokens": 5000},
    "testing": {"temperature": 0.3, "max_tokens": 4000},
    "verification": {"temperature": 0.1, "max_tokens": 3000},
    "security": {"temperature": 0.2, "max_tokens": 4000},
    "analysis": {"temperature": 0.4, "max_tokens": 4000},
    "research": {"temperature": 0.5, "max_tokens": 5000},
    "writing": {"temperature": 0.7, "max_tokens": 5000},
}
_DEFAULT_PARAMS = {"temperature": 0.4, "max_tokens": 4096}

# ── 6. task→model routing hints ───────────────────────────────────────────── #
_STRONG = ["claude", "gpt-5", "gpt-4o"]
_HEAVY_ROLES = {"coding", "debug", "fix", "analysis", "security", "verification", "planning"}


def _preferred_for(role: str) -> list[str]:
    return _STRONG if role in _HEAVY_ROLES else []


# ── 1. output contracts ───────────────────────────────────────────────────── #
_FORMATS: dict[str, str] = {
    "coding": "Return one fenced code block (```lang … ```) with correct, runnable code, then a 2-3 line note on what it does.",
    "debug": "Return: ROOT CAUSE (short bullets), then FIX as a fenced code block, then one PREVENTION line.",
    "fix": "Return: DEFECT (1 line), then FIXED CODE as a fenced code block, then one regression note.",
    "testing": "Return a TEST PLAN (bullets) plus fenced test code covering success and failure paths.",
    "research": "Return FINDINGS as concrete bullets, then a SOURCES list. No vague claims.",
    "writing": "Return only the final prose, properly structured. No meta commentary.",
    "analysis": "Return INSIGHTS bullets (specific, numbered) then a one-paragraph CONCLUSION.",
    "review": "Return ISSUES bullets (severity-tagged) then a VERDICT line.",
    "security": "Return FINDINGS bullets (risk-tagged) then REMEDIATION bullets.",
}
_FORMAT_DEFAULT = "Return a complete, well-structured answer that fully addresses the goal."


def _contract_for(role: str) -> str:
    return (
        "\n\n--- OUTPUT CONTRACT ---\n"
        "Think step-by-step internally; show only the final result.\n"
        + (_FORMATS.get(role, _FORMAT_DEFAULT))
        + "\nQuality bar: complete and concrete; directly addresses the goal; no placeholders, no truncation.\n"
    )


# ── 8. parsing hardening ──────────────────────────────────────────────────── #
def extract_code(text: str) -> str:
    """Pull the first fenced code block; fall back to raw text."""
    m = re.search(r"```[\w-]*\n(.*?)```", text or "", re.S)
    return m.group(1).strip() if m else (text or "").strip()


def safe_json(text: str) -> Optional[Any]:
    """Robust JSON extraction from model output (any provider)."""
    if not text:
        return None
    for opener, closer in (("{", "}"), ("[", "]")):
        i = text.find(opener)
        j = text.rfind(closer)
        if i != -1 and j > i:
            try:
                return json.loads(text[i:j + 1])
            except Exception:
                continue
    return None


# ── core LLM call (with quality layer) ────────────────────────────────────── #
async def reason_via_llm(
    gateway,
    prompt: str,
    capability: LLMCapability = LLMCapability.CHAT,
    params: Optional[dict[str, Any]] = None,
    preferred: Optional[list[str]] = None,
    contract: bool = True,
    image: Optional[str] = None,
) -> str:
    """Generate substantive content through the gateway and return plain text.

    Applies the role's output contract, generation params and model preference
    automatically. When `image` (data-URI or http url) is given the request is
    multimodal (vision) so the model sees the image — model-based OCR included.
    On any failure it returns the echoed prompt so callers remain deterministic
    and never raise unexpectedly.
    """
    role = _role_of(prompt)
    full = (prompt + _contract_for(role)) if contract else prompt
    content_payload: Any = _multimodal(full, image)
    if content_payload is not full:
        logger.info("multimodal_request", image_len=len(image or ""))
    try:
        request = LLMRequest(
            capability=capability,
            messages=[Message(role="user", content=content_payload)],
            params=params or _ROLE_PARAMS.get(role, _DEFAULT_PARAMS),
            preferred_contains=preferred if preferred is not None else _preferred_for(role),
        )
        # token-level streaming when a step emit sink is attached
        emit = _step_emit.get()
        if emit is not None and getattr(settings, "streaming", True):
            try:
                buf: list[str] = []
                async for chunk in gateway.complete_stream(request):
                    buf.append(chunk)
                    emit(chunk)
                text = "".join(buf)
                if text:
                    return text
            except Exception as exc:  # noqa: BLE001 - stream died -> non-stream fallback
                logger.warning("stream_failed_fallback", error=str(exc))
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


# ── 3. agentic tool loop (bounded: max 1 tool call, 2 extra LLM passes) ───── #
def _multimodal(text: str, image: Optional[str]) -> Any:
    """OpenAI-style vision content parts when a data-URI/http image is attached."""
    if image and isinstance(image, str) and image.startswith(("data:image", "http://", "https://")):
        return [
            {"type": "text", "text": text},
            {"type": "image_url", "image_url": {"url": image}},
        ]
    return text


async def _refine(gateway, prompt: str, draft: str) -> str:
    """Quality-engineering A: self-refine pass — the model critiques its own draft
    against the goal and rewrites it. One extra LLM call; fail-safe to the draft."""
    if not getattr(settings, "self_refine", True) or not draft:
        return draft
    role = _role_of(prompt)
    if role in ("verification", "testing"):
        return draft  # judges/tests stay single-pass
    ask = (
        prompt
        + "\n\nDRAFT ANSWER:\n"
        + draft[:4000]
        + "\n\nSELF-REVIEW: check the draft against the goal — completeness, correctness, "
        + "concrete detail, formatting. Fix every weakness and output the FINAL improved "
        + "answer in full (no diffs, no commentary about the review)."
    )
    try:
        logger.info("refine_pass", role=role or "generic")
        improved = await reason_via_llm(gateway, ask, contract=False)
        if improved and improved.strip() != ask.strip() and not improved.startswith("You are"):
            return improved
    except Exception as exc:  # noqa: BLE001
        logger.warning("refine_failed", error=str(exc))
    return draft


async def reason_with_ctx(ctx, gateway, prompt: str, **kw: Any) -> str:
    """reason_via_llm with the task image (if any) attached from context memory."""
    image = None
    try:
        image = (getattr(ctx, "memory", None) or {}).get("image")
    except Exception:  # noqa: BLE001
        image = None
    content = await reason_via_llm(gateway, prompt, image=image, **kw)
    return await _refine(gateway, prompt, content)


async def reason_with_tools(
    gateway,
    prompt: str,
    tool_manager,
    tool_ids: list[str],
    image: Optional[str] = None,
) -> str:
    """Reason → optionally execute ONE tool → observe → final improved reasoning.

    Never raises; degrades to plain reasoning when tools are unavailable.
    """
    draft = await reason_via_llm(gateway, prompt, image=image)
    if tool_manager is None or not tool_ids:
        return draft

    ask = (
        prompt
        + "\nDRAFT OUTPUT:\n" + draft[:1500]
        + "\n\nYou may call ONE tool to execute/verify your draft. Available tools: "
        + ", ".join(tool_ids)
        + '\nRespond with strict JSON only: {"tool": "<tool-id or null>", "args": {}}'
    )
    raw = await reason_via_llm(gateway, ask, params={"temperature": 0.0, "max_tokens": 300}, contract=False)
    act = safe_json(raw) or {}
    tool = act.get("tool")
    observation = ""
    if isinstance(tool, str) and tool in tool_ids and hasattr(tool_manager, "invoke"):
        try:
            from app.core.tool import ToolInvocation

            invocation = ToolInvocation(tool_id=tool, params=act.get("args") or {}, caller="tool-loop")
            result = await tool_manager.invoke(invocation)
            if result is not None:
                observation = str(getattr(result, "output", result) or "")[:1200]
        except Exception as exc:  # noqa: BLE001
            logger.warning("tool_loop_invoke_failed", tool=tool, error=str(exc))

    if not observation:
        return await _refine(gateway, prompt, draft)

    final_prompt = (
        prompt
        + "\nDRAFT:\n" + draft[:2000]
        + f"\nTOOL OBSERVATION ({tool}):\n" + observation
        + "\nUsing the observation, produce the final improved answer."
    )
    final = await reason_via_llm(gateway, final_prompt, image=image)
    return await _refine(gateway, prompt, final)
