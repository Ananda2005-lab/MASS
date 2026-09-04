"""WebSocket + SSE endpoints (implementation/14-realtime.md, decision 01 Hybrid).

WS = primary (bidirectional commands + events). SSE = secondary (read-only event stream
with last_seq resume). Both carry the same Event envelope. Auth via token (security/auth).
"""
from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.api.deps import get_runtime
from app.core.event import EventType
from app.realtime.hub import RealtimeHub
from app.security.auth import verify_token

router = APIRouter()


def _hub(request: Request) -> RealtimeHub:
    rt = get_runtime(request)
    return RealtimeHub(rt.event_bus)


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token", "")
    task_id = websocket.query_params.get("task_id", "")
    try:
        verify_token(token)
    except Exception:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    hub = _hub(websocket)
    disconnect = hub.connect(task_id, lambda ev: websocket.send_json(ev))
    try:
        while True:
            data = await websocket.receive_json()
            # Inbound command routing (implementation/14.6): forward to runtime, no logic here.
            cmd = data.get("type")
            rt = get_runtime(websocket)
            if cmd == "approve":
                # permission resolution handled by Security; emit resolved event.
                await rt.event_bus.publish(
                    _event(task_id, EventType.PERMISSION_RESOLVED, {"ticket": data.get("ticket")})
                )
            # pause/resume/interrupt similarly delegate to runtime in later phases.
    except WebSocketDisconnect:
        pass
    finally:
        disconnect()


@router.get("/events")
async def sse_endpoint(request: Request, task_id: str, token: str = "", last_seq: int = 0):
    try:
        verify_token(token)
    except Exception:
        raise HTTPException(status_code=403, detail="forbidden")
    rt = get_runtime(request)
    hub = RealtimeHub(rt.event_bus)
    queue: asyncio.Queue = asyncio.Queue()

    async def _send(ev: dict) -> None:
        await queue.put(ev)

    disconnect = hub.connect(task_id, _send)

    async def gen():
        # Resume: replay missed events first.
        for ev in await rt.event_bus.replay(task_id, int(last_seq)):
            yield f"data: {json.dumps(ev)}\n\n"
        while True:
            ev = await queue.get()
            yield f"data: {json.dumps(ev)}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


def _event(task_id: str, etype: EventType, payload: dict):
    from app.core.event import Event, EventActor
    return Event(type=etype, task_id=task_id, actor=EventActor.USER, payload=payload)
