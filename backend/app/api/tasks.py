"""Task + Workspace + Tools + Config routers (implementation/15-backend-api.md).

All delegate to Runtime/state; no orchestration logic in routers.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Request

from app.api.deps import get_runtime
from app.api.schemas import WorkspaceActionBody
from app.core.task import TaskStatus

router = APIRouter(tags=["tasks"])


@router.post("/conversations")
async def create_conversation(request: Request, body: dict | None = None):
    user_id = (body or {}).get("user_id", "default-user")
    return {"conversation_id": str(uuid.uuid4()), "user_id": user_id}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, request: Request):
    rt = get_runtime(request)
    task = await rt.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return task.model_dump()


@router.get("/tasks/{task_id}/state")
async def get_task_state(task_id: str, request: Request):
    rt = get_runtime(request)
    task = await rt.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return {
        "task_id": task.id,
        "status": task.status.value,
        "current_step_id": task.current_step_id,
        "plan": task.plan.model_dump(),
    }


@router.get("/tasks/{task_id}/results")
async def get_results(task_id: str, request: Request):
    rt = get_runtime(request)
    task = await rt.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    return {
        "results": [s.result.model_dump() for s in task.plan.steps if s.result],
        "final": task.final_result.model_dump() if task.final_result else None,
    }


@router.post("/workspace/action")
async def workspace_action(body: WorkspaceActionBody, request: Request):
    rt = get_runtime(request)
    task = await rt.get_task(body.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="task not found")
    # Mode B interaction; for MVP returns current state. Real actions wired per feature.
    return {"task_id": body.task_id, "action": body.action, "accepted": True}


@router.get("/tools")
async def list_tools(request: Request):
    rt = get_runtime(request)
    return [t.model_dump() for t in rt.tool_manager.list_tools()]


@router.get("/config/modes")
async def config_modes():
    return {
        "modes": ["instruction", "workspace"],
        "realtime": {"websocket": True, "sse": True},
        "note": "Two distinct purpose-built experiences sharing one core (Master Spec §4).",
    }
