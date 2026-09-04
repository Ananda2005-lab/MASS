"""Memory Manager: runtime facade for assembling context bundles and persisting memory.

Spec: Master Project Specification §13 (Memory and Context), §14 (Task State).
The MemoryManager is the single entry point used by the runtime/agents. It:
  - builds a ContextBundle from task goal, input refs, and stored memories,
  - estimates per-layer tokens using the compressor,
  - triggers compression when the bundle exceeds the token threshold,
  - persists memory items via MemoryStore.

No provider SDKs are used directly; summarization (if any) flows through the
LLM Gateway via the compressor.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.config import settings
from app.core.context import ContextBundle, ContextLayer, ContextLayerKind
from app.core.task import Ref, RefKind
from app.log import get_logger
from app.memory.compressor import ContextCompressor
from app.memory.store import MemoryStore
from app.persistence.repos import MemoryRepo

logger = get_logger("runtime.memory_manager")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _layer_kind_for_ref(ref: Ref) -> ContextLayerKind:
    """Map an input RefKind to the closest ContextLayerKind.

    There is no ARTIFACT ContextLayerKind, so both RESULT and ARTIFACT refs
    become RESULT layers; MEMORY refs become MEMORY layers; CONTEXT and any
    other kind fall back to TASK_STATE.
    """
    if ref.kind == RefKind.RESULT:
        return ContextLayerKind.RESULT
    if ref.kind == RefKind.ARTIFACT:
        return ContextLayerKind.RESULT
    if ref.kind == RefKind.MEMORY:
        return ContextLayerKind.MEMORY
    return ContextLayerKind.TASK_STATE


class MemoryManager:
    def __init__(
        self,
        memory_repo: MemoryRepo,
        compressor: ContextCompressor,
        gateway: Optional[object] = None,
    ) -> None:
        self._repo = memory_repo
        self._compressor = compressor
        self._gateway = gateway
        self._store = MemoryStore(memory_repo)

    async def assemble(
        self,
        task_id: str,
        step_id: str,
        goal: str,
        inputs: list[Ref],
        needed_kinds=None,
        user_id: str = "",
    ) -> ContextBundle:
        layers: list[ContextLayer] = []

        # 1. INSTRUCTION layer (carries the goal via content_ref; ContextLayer
        #    has no `content` field, so the goal text lives in content_ref).
        instr = ContextLayer(
            kind=ContextLayerKind.INSTRUCTION,
            source_ref=Ref(kind=RefKind.CONTEXT, id=task_id),
            content_ref=goal,
            importance=1.0,
        )
        instr.tokens = self._compressor.estimate_tokens(str(instr.content_ref))
        layers.append(instr)

        # 2. One RESULT/ARTIFACT layer per input Ref.
        for ref in inputs:
            kind = _layer_kind_for_ref(ref)
            layer = ContextLayer(
                kind=kind,
                source_ref=ref,
                content_ref=ref.id,
                importance=0.8,
            )
            layer.tokens = self._compressor.estimate_tokens(str(layer.content_ref))
            layers.append(layer)

        # 3. MEMORY layers from stored important memories.
        memories = await self._store.get_important(user_id)
        for item in memories:
            if needed_kinds is not None and item.get("kind") not in needed_kinds:
                continue
            mem = ContextLayer(
                kind=ContextLayerKind.MEMORY,
                source_ref=Ref(kind=RefKind.MEMORY, id=item["id"]),
                content_ref=item["content"],
                importance=item.get("importance", 0.6),
            )
            mem.tokens = self._compressor.estimate_tokens(str(mem.content_ref))
            layers.append(mem)

        token_estimate = sum(l.tokens for l in layers)
        bundle = ContextBundle(
            layers=layers,
            assembled_at=_now_iso(),
            token_estimate=token_estimate,
            compressed=False,
        )

        threshold = int(self._compressor.threshold_ratio * self._compressor.default_context_window)
        if token_estimate > threshold:
            bundle = await self._compressor.compress(bundle)

        return bundle


def create_memory_manager(
    memory_repo: MemoryRepo,
    gateway: Optional[object] = None,
) -> MemoryManager:
    """Build a MemoryManager with its compressor wired up."""
    compressor = ContextCompressor(gateway=gateway)
    return MemoryManager(
        memory_repo=memory_repo,
        compressor=compressor,
        gateway=gateway,
    )
