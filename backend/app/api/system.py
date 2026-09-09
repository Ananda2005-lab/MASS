"""System API: provider/safety status + project folder attach (Claude/Codex style)."""
from __future__ import annotations

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.api.deps import get_runtime
from app.config import settings
from app.log import get_logger

logger = get_logger("api.system")
router = APIRouter(tags=["system"])


class SafetyBody(BaseModel):
    mode: str  # "auto" | "ask"


class EnabledBody(BaseModel):
    enabled: bool


class ProjectBody(BaseModel):
    path: str


class UploadFile(BaseModel):
    path: str  # relative path inside the folder
    b64: str   # base64 content


class UploadBody(BaseModel):
    name: str
    files: list[UploadFile]


@router.get("/system")
async def get_system(request: Request):
    rt = get_runtime(request)
    providers = sorted({m.provider_id for m in rt.gateway.models.values()})
    from app.core.sub_agent import SubAgentRole

    disabled_tools = {x.strip() for x in (settings.disabled_tools or "").split(",") if x.strip()}
    disabled_roles = {x.strip() for x in (settings.disabled_roles or "").split(",") if x.strip()}
    return {
        "safety_mode": settings.safety_mode,
        "sandbox_scope": settings.sandbox_scope,
        "providers": providers,
        "project_path": getattr(rt, "project_path", None),
        "mcp_tools": [t.id for t in rt.tool_manager.list_tools() if t.id.startswith("mcp.")],
        "tools": [
            {
                "id": t.id,
                "cat": getattr(t.metadata.category, "value", str(t.metadata.category)),
                "perms": [p.name for p in (t.metadata.permissions or [])],
                "enabled": t.id not in disabled_tools,
            }
            for t in rt.tool_manager.list_tools()
        ],
        "roles": [r.value for r in SubAgentRole],
        "disabled_roles": sorted(disabled_roles),
        "provider_health": _provider_health(rt),
    }


@router.post("/system/tools/{tool_id}/enabled")
async def set_tool_enabled(tool_id: str, body: EnabledBody, request: Request):
    cur = {x.strip() for x in (settings.disabled_tools or "").split(",") if x.strip()}
    if body.enabled:
        cur.discard(tool_id)
    else:
        cur.add(tool_id)
    settings.disabled_tools = ",".join(sorted(cur))
    logger.info("tool_gating_changed", tool=tool_id, enabled=body.enabled)
    return {"ok": True, "enabled": body.enabled}


@router.post("/system/roles/{role}/enabled")
async def set_role_enabled(role: str, body: EnabledBody, request: Request):
    cur = {x.strip() for x in (settings.disabled_roles or "").split(",") if x.strip()}
    if body.enabled:
        cur.discard(role)
    else:
        cur.add(role)
    settings.disabled_roles = ",".join(sorted(cur))
    logger.info("role_gating_changed", role=role, enabled=body.enabled)
    return {"ok": True, "enabled": body.enabled}


def _provider_health(rt) -> dict:
    health: dict[str, dict] = {}
    for key, h in rt.gateway.state.health.items():
        prov = key.split("|")[0]
        agg = health.setdefault(prov, {"calls": 0, "ok": 0, "fail": 0, "latency_ms": 0.0})
        agg["calls"] += h.success_count + h.failure_count
        agg["ok"] += h.success_count
        agg["fail"] += h.failure_count
        agg["latency_ms"] = max(agg["latency_ms"], round(h.avg_latency, 1))
    return health


@router.get("/project/file")
async def project_file(path: str, request: Request):
    """Read one attached-project file (guarded: must stay inside project root)."""
    import os

    rt = get_runtime(request)
    root = getattr(rt, "project_path", None)
    if not root or not os.path.isdir(root):
        return {"ok": False, "error": "no project attached"}
    full = os.path.realpath(os.path.join(root, path))
    if not full.startswith(os.path.realpath(root) + os.sep):
        return {"ok": False, "error": "path outside project"}
    if not os.path.isfile(full):
        return {"ok": False, "error": "not a file"}
    try:
        with open(full, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(200_000)
    except OSError as e:  # noqa: BLE001
        return {"ok": False, "error": str(e)}
    return {"ok": True, "path": path, "content": content}


@router.post("/system/safety")
async def set_safety(body: SafetyBody, request: Request):
    if body.mode not in ("auto", "ask"):
        return {"ok": False, "error": "mode must be 'auto' or 'ask'"}
    settings.safety_mode = body.mode
    logger.info("safety_mode_changed", mode=body.mode)
    return {"ok": True, "safety_mode": settings.safety_mode}


@router.post("/project")
async def attach_project(body: ProjectBody, request: Request):
    rt = get_runtime(request)
    n = await rt.attach_project(body.path)
    return {"ok": n > 0, "tools": n, "path": body.path, "project_path": rt.project_path}


@router.get("/project/tree")
async def project_tree(request: Request):
    """Real folder tree of the attached project (depth-limited, junk skipped)."""
    import os

    rt = get_runtime(request)
    root = getattr(rt, "project_path", None)
    if not root or not os.path.isdir(root):
        return {"project_path": None, "tree": []}
    skip = {"node_modules", ".git", "dist", "build", ".next", "coverage", "__pycache__", ".venv"}

    def walk(p: str, depth: int) -> list:
        out: list = []
        try:
            names = sorted(os.listdir(p))
        except OSError:
            return out
        for n in names:
            if n in skip or len(out) > 150:
                continue
            full = os.path.join(p, n)
            if os.path.isdir(full):
                if depth < 3:
                    out.append({"name": n, "type": "dir", "children": walk(full, depth + 1)})
            else:
                out.append({"name": n, "type": "file"})
        return out

    return {"project_path": root, "tree": walk(root, 0)}


@router.post("/project/upload")
async def upload_project(body: UploadBody, request: Request):
    """Browser folder-picker upload: files land in ./projects/<name>/ keeping the
    folder structure, then the folder is attached as the MCP project root."""
    import base64
    import os
    import re

    rt = get_runtime(request)
    safe = re.sub(r"[^A-Za-z0-9_-]+", "-", body.name.strip()) or "project"
    root = os.path.abspath(os.path.join("./projects", safe))
    os.makedirs(root, exist_ok=True)
    written = 0
    for f in body.files[:1000]:
        rel = f.path.replace("\\", "/").lstrip("/")
        if not rel or ".." in rel.split("/"):
            continue
        target = os.path.abspath(os.path.join(root, rel))
        if target != root and not target.startswith(root + os.sep):
            continue
        os.makedirs(os.path.dirname(target), exist_ok=True)
        try:
            with open(target, "wb") as fh:
                fh.write(base64.b64decode(f.b64))
            written += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning("upload_file_failed", path=rel, error=str(exc)[:120])
    n = await rt.attach_project(root)
    return {"ok": n > 0, "written": written, "tools": n, "project_path": rt.project_path}
