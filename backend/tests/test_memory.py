"""T8 — Threshold-triggered context lifecycle (decision 05 / 10)."""
import pytest
from app.memory.compressor import ContextCompressor
from app.core.context import ContextBundle, ContextLayer, ContextLayerKind
from app.core.task import Ref, RefKind


def _bundle(tokens, n_layers):
    layers = [
        ContextLayer(kind=ContextLayerKind.TOOL_RESULT, source_ref=Ref(kind=RefKind.RESULT, id=f"r{i}"),
                     content_ref=f"x{i}" * 5, tokens=tokens, importance=0.1 if i > 0 else 1.0)
        for i in range(n_layers)
    ]
    b = ContextBundle(layers=layers)
    b.token_estimate = sum(tokens for _ in range(1)) * n_layers
    return b


@pytest.mark.asyncio
async def test_compression_triggers_over_threshold():
    comp = ContextCompressor(threshold_ratio=0.5, default_context_window=100)
    b = _bundle(tokens=20, n_layers=10)  # 200 > 50
    out = await comp.compress(b)
    assert out.compressed is True
    assert out.token_estimate <= 50


@pytest.mark.asyncio
async def test_no_compression_under_threshold():
    comp = ContextCompressor(threshold_ratio=0.7, default_context_window=100000)
    b = _bundle(tokens=10, n_layers=2)
    out = await comp.compress(b)
    assert out.compressed is False


@pytest.mark.asyncio
async def test_assemble_builds_layers(runtime):
    b = await runtime.memory_manager.assemble("t1", "s1", "my goal", [], user_id="u1")
    assert isinstance(b, ContextBundle)
    kinds = {l.kind for l in b.layers}
    assert ContextLayerKind.INSTRUCTION in kinds
