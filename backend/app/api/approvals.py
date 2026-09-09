"""Approvals API (Ask mode). GET pending, POST decision. UI polls this."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.security.approvals import approvals

router = APIRouter(prefix="/approvals", tags=["approvals"])


class DecisionBody(BaseModel):
    approved: bool


@router.get("")
async def list_approvals():
    return {"pending": approvals.list_pending(), "history": approvals.history()}


@router.post("/{rid}/decision")
async def decide(rid: str, body: DecisionBody):
    ok = approvals.decide(rid, body.approved)
    return {"ok": ok}
