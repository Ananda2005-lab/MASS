"""Context compression for memory/context bundles.

Spec: Master Project Specification §13 (Memory and Context), §14 (Task State).
Operates only on the locked ContextBundle / ContextLayer contracts. No provider
SDKs are used here; any summarization goes strictly through the LLM Gateway's
`complete` method, wrapped so it can never crash the compression path.

The ContextLayer contract carries content via `content_ref` (there is no
`content` field on ContextLayer), so token estimation and summarization use
`content_ref`.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.config import settings
from app.core.context import ContextBundle, ContextLayer, ContextLayerKind
from app.core.llm import LLMCapability, LLMRequest, Message
from app.core.task import Ref, RefKind
from app.log import get_logger

logger = get_logger("memory.compressor")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ContextCompressor:
    """Drops low-importance CONVERSATION/TOOL_RESULT layers when a bundle exceeds
    the configured token threshold, optionally emitting a gateway-produced summary
    of the dropped content."""

    def __init__(
        self,
        gateway: Optional[object] = None,
        threshold_ratio: float = settings.context_token_threshold_ratio,
        default_context_window: int = 8192,
    ) -> None:
        self._gateway = gateway
        self.threshold_ratio = threshold_ratio
        self.default_context_window = default_context_window

    def estimate_tokens(self, text: str) -> int:
        return len(text) // 4

    def _threshold(self) -> int:
        return int(self.threshold_ratio * self.default_context_window)

    async def compress(self, bundle: ContextBundle) -> ContextBundle:
        threshold = self._threshold()
        if bundle.token_estimate <= threshold:
            return bundle

        droppable_kinds = (ContextLayerKind.CONVERSATION, ContextLayerKind.TOOL_RESULT)
        non_droppable = [l for l in bundle.layers if l.kind not in droppable_kinds]
        droppable = sorted(
            [l for l in bundle.layers if l.kind in droppable_kinds],
            key=lambda l: l.importance,
        )

        dropped: list[ContextLayer] = []
        kept = list(droppable)
        # Drop lowest-importance droppable layers until under threshold,
        # but always keep at least one droppable layer (never empty the bundle).
        while True:
            current_est = sum(l.tokens for l in (non_droppable + kept))
            if current_est <= threshold:
                break
            if len(kept) <= 1:
                break
            dropped.append(kept.pop(0))

        new_layers = list(non_droppable) + list(kept)

        # Optionally summarize dropped content. Never let a gateway failure crash
        # compression: on any exception we simply drop without a summary.
        if self._gateway is not None and dropped:
            try:
                dropped_text = "\n\n".join(str(l.content_ref) for l in dropped)
                resp = await self._gateway.complete(
                    LLMRequest(
                        capability=LLMCapability.CHAT,
                        messages=[
                            Message(role="user", content=f"summarize: {dropped_text}")
                        ],
                    )
                )
                summary_text = getattr(resp, "content", None)
                if summary_text is not None:
                    summary_layer = ContextLayer(
                        kind=ContextLayerKind.MEMORY,
                        source_ref=Ref(kind=RefKind.CONTEXT, id="compressed_summary"),
                        content_ref=str(summary_text),
                        tokens=self.estimate_tokens(str(summary_text)),
                        importance=0.9,
                    )
                    new_layers.append(summary_layer)
            except Exception as e:  # pragma: no cover - defensive
                logger.warning("compress_summary_failed", error=str(e))

        token_estimate = sum(l.tokens for l in new_layers)
        return ContextBundle(
            layers=new_layers,
            assembled_at=bundle.assembled_at,
            token_estimate=token_estimate,
            compressed=True,
        )
