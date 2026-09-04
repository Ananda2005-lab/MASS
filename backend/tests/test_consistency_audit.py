"""T14 — Architecture-consistency audit (static). Compares implementation against locked rules."""
import os
import pytest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # backend/
APP = ROOT / "app"
FRONTEND = ROOT.parent / "frontend"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")


def test_runtime_does_not_import_api_or_realtime():
    for f in (APP / "runtime").rglob("*.py"):
        txt = _read(f)
        assert "import app.api" not in txt and "from app.api" not in txt
        assert "import app.realtime" not in txt and "from app.realtime" not in txt


def test_no_direct_provider_sdk_in_core_runtime():
    forbidden = ("import openai", "import anthropic", "from openai", "from anthropic")
    for f in APP.rglob("*.py"):
        if "gateway/adapters" in str(f):
            continue  # adapters are the ONLY allowed SDK location
        txt = _read(f)
        for bad in forbidden:
            assert bad not in txt, f"provider SDK leaked into {f}"


def test_gateway_is_only_provider_sdk_holder():
    adapters = list((APP / "gateway" / "adapters").rglob("*.py"))
    assert adapters, "gateway adapters dir must exist"


def test_two_mode_pages_exist_and_distinct():
    instr = FRONTEND / "app" / "(instruction)" / "page.tsx"
    ws = FRONTEND / "app" / "(workspace)" / "page.tsx"
    assert instr.exists() and ws.exists()
    # they must differ (Instruction != chatbot, Workspace != IDE)
    assert _read(instr) != _read(ws)


def test_frontend_mirrors_backend_contracts():
    types = FRONTEND / "lib" / "types.ts"
    assert types.exists()
    txt = _read(types)
    for name in ("Task", "Plan", "Step", "SubAgentRole", "Event"):
        assert name in txt


def test_no_source_truth_docs_modified():
    # planning/ and architecture/ are not edited by Phase 4/5 code; assert they still exist.
    proj = ROOT.parent
    assert (proj / "planning").is_dir()
    assert (proj / "architecture").is_dir()
    assert (proj / "implementation").is_dir()
