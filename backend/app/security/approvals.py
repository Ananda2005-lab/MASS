"""Ask-mode approval flow (implementation/17-security.md 17.2, extended).

In ASK safety mode a gated tool call does NOT get silently denied: it registers a
pending approval request and BLOCKS until the user approves/denies (or timeout).
The UI polls GET /approvals and POSTs the decision; this module is the bridge.
"""
from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass
from typing import Optional

from app.log import get_logger

logger = get_logger("security.approvals")

APPROVAL_TIMEOUT_SECONDS = 600


@dataclass
class ApprovalRequest:
    id: str
    tool_id: str
    args: dict
    caller: str
    created: float
    decision: Optional[str] = None  # None | "approved" | "denied"


class ApprovalManager:
    def __init__(self) -> None:
        self._pending: dict[str, ApprovalRequest] = {}
        self._events: dict[str, asyncio.Event] = {}
        self._history: list[dict] = []

    def history(self) -> list[dict]:
        return list(reversed(self._history))

    def list_pending(self) -> list[dict]:
        return [
            {
                "id": r.id,
                "tool_id": r.tool_id,
                "args": r.args,
                "caller": r.caller,
                "created": r.created,
            }
            for r in self._pending.values()
            if r.decision is None
        ]

    async def request(self, tool_id: str, args: dict, caller: str) -> bool:
        """Block until decided. True = approved, False = denied/timeout."""
        rid = uuid.uuid4().hex[:12]
        req = ApprovalRequest(
            id=rid, tool_id=tool_id, args=args or {}, caller=caller or "", created=time.time()
        )
        ev = asyncio.Event()
        self._pending[rid] = req
        self._events[rid] = ev
        logger.info("approval_requested", id=rid, tool=tool_id, caller=caller)
        try:
            await asyncio.wait_for(ev.wait(), timeout=APPROVAL_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            req.decision = "denied"
            logger.warning("approval_timeout", id=rid, tool=tool_id)
            return False
        finally:
            self._pending.pop(rid, None)
            self._events.pop(rid, None)
            self._history.append(
                {"id": rid, "tool_id": tool_id, "decision": req.decision, "at": time.time()}
            )
            if len(self._history) > 20:
                self._history.pop(0)
        logger.info("approval_resolved", id=rid, tool=tool_id, decision=req.decision)
        return req.decision == "approved"

    def decide(self, rid: str, approved: bool) -> bool:
        req = self._pending.get(rid)
        ev = self._events.get(rid)
        if req is None or ev is None or req.decision is not None:
            return False
        req.decision = "approved" if approved else "denied"
        ev.set()
        return True


approvals = ApprovalManager()
