"""T10 — Backend API integration (Instruction + Workspace + task state + results)."""
import pytest
from fastapi.testclient import TestClient
from app.main import create_app


@pytest.fixture
def client():
    with TestClient(create_app()) as c:
        yield c


def test_health_and_modes(client):
    assert client.get("/health").json()["status"] == "ok"
    modes = client.get("/config/modes").json()["modes"]
    assert "instruction" in modes and "workspace" in modes


def test_tools_listed(client):
    assert len(client.get("/tools").json()) == 6


def test_instruction_flow_and_results(client):
    r = client.post("/instruction", json={"raw": "Write a report on clouds", "user_id": "u1"})
    assert r.status_code == 200
    tid = r.json()["task_id"]
    # poll until terminal
    import time
    for _ in range(50):
        s = client.get(f"/tasks/{tid}/state").json()
        if s["status"] in ("completed", "failed"):
            break
        time.sleep(0.2)
    assert s["status"] == "completed"
    res = client.get(f"/tasks/{tid}/results").json()
    assert res["final"] is not None


def test_invalid_task_returns_404(client):
    assert client.get("/tasks/does-not-exist/state").status_code == 404
