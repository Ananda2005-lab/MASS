"""T9 — Realtime: shared vocabulary, SSE replay path, WS auth/accept (14, decision 01)."""
import asyncio
import json
import types
import pytest
from app.core.event import Event, EventType
from app.realtime.hub import RealtimeHub
from app.realtime.websocket import sse_endpoint, ws_endpoint
from app.security.auth import create_token, verify_token
from fastapi import WebSocketDisconnect


@pytest.mark.asyncio
async def test_hub_fanout_shared_vocabulary(runtime):
    hub = RealtimeHub(runtime.event_bus)
    received = []

    async def send(ev):
        received.append(ev)

    disconnect = hub.connect("task-rt", send)
    await runtime.event_bus.publish(Event(type=EventType.INFO, task_id="task-rt", payload={"k": 1}))
    await asyncio.sleep(0)  # let the hub's dispatched send task run
    disconnect()
    assert len(received) == 1
    assert received[0]["type"] == "info"  # same Event envelope for WS+SSE


@pytest.mark.asyncio
async def test_sse_replays_persisted_events(runtime):
    token = create_token("u1")
    await runtime.event_bus.publish(Event(type=EventType.INFO, task_id="sse-t1", payload={"x": 1}))

    # Resolve get_runtime() to the test runtime (same loop; no HTTP transport deadlock).
    class FakeRequest:
        app = types.SimpleNamespace(state=types.SimpleNamespace(runtime=runtime))

    resp = await sse_endpoint(FakeRequest(), task_id="sse-t1", token=token, last_seq=0)
    chunks = []
    async for chunk in resp.body_iterator:
        chunks.append(chunk)
        break  # first emitted event is enough; generator would otherwise block on queue
    assert chunks and chunks[0].startswith("data: ")
    data = json.loads(chunks[0][len("data: "):])
    assert data["task_id"] == "sse-t1"
    assert data["type"] == "info"


@pytest.mark.asyncio
async def test_ws_rejects_forged_token(runtime):
    class FakeWS:
        def __init__(self, token, task_id, runtime):
            self.query_params = {"token": token, "task_id": task_id}
            self.app = types.SimpleNamespace(state=types.SimpleNamespace(runtime=runtime))
            self.accepted = False
            self.closed = None

        async def accept(self):
            self.accepted = True

        async def close(self, code=1000):
            self.closed = code

        async def receive_json(self):
            raise WebSocketDisconnect()

    # forged token -> WS must refuse with 1008 (security gate, shared with SSE)
    bad = FakeWS("not.a.valid.token", "ws-bad", runtime)
    await ws_endpoint(bad)
    assert bad.closed == 1008
    assert bad.accepted is False

    # valid token -> WS accepts (then disconnects when client closes)
    good = FakeWS(create_token("u1"), "ws-good", runtime)
    await ws_endpoint(good)
    assert good.accepted is True
