"""Instruction Mode API (Mode A). POST /instruction creates + dispatches a task.

Spec: implementation/15-backend-api.md + 19-instruction-mode.md. Delegates to Runtime;
does NOT contain orchestration logic.
"""
from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, HTTPException, Request

from app.api.deps import get_runtime
from app.api.schemas import InstructionBody
from app.exceptions import AgentPlatformError
from app.log import get_logger

logger = get_logger("api.instruction")
router = APIRouter(prefix="/instruction", tags=["instruction"])


@router.post("")
async def post_instruction(body: InstructionBody, request: Request):
    rt = get_runtime(request)
    conversation_id = body.conversation_id or str(uuid.uuid4())
    task = await rt.submit_instruction(body.raw, conversation_id, body.user_id or "default-user", body.mode)
    # Dispatch execution in the background; realtime streams progress (14).
    asyncio.create_task(_safe_run(rt, task.id))
    return {"task_id": task.id, "conversation_id": conversation_id, "status": task.status.value}


async def _safe_run(rt, task_id: str) -> None:
    try:
        task = await rt.get_task(task_id)
        if task:
            await rt.run_task(task)
    except Exception as e:
        logger.error("task_run_failed", task_id=task_id, error=str(e))
