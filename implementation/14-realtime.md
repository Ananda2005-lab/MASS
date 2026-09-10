# 14 — Realtime (Hybrid: WebSocket + SSE)

Implements Phase 1 §4 (concept), §18 (WebSocket/SSE) and Phase 2.1 decision 01 (Hybrid Realtime). **WebSocket = primary** (bidirectional: UI sends commands/interrupts, receives events). **SSE = secondary** (read-only event stream, fallback/compat). Same event model (13.4). No separate event format.

## 14.1 Transport roles
| Transport | Direction | Use | When |
|-----------|-----------|-----|------|
| WebSocket | bidirectional | primary realtime channel | default (supported clients) |
| SSE | server→client only | secondary event stream | fallback / no WS / simple consumers |

Both carry the same `Event` envelope (§4.24). WS additionally carries command frames (interrupt, approve permission, send message).

## 14.2 WebSocket server
Module: `app/realtime/websocket.py` (FastAPI `WebSocket`).
- Endpoint: `/ws?conversation_id=&task_id=&token=`.
- Auth: `security/auth` validates token (17); reject unauthenticated.
- On connect: subscribe to task/conversation scopes; send recent events (replay from event_bus 13.4) to restore view.
- Inbound command frames: `{ type: enum(interrupt|approve|message|pause|resume), payload }` → routed to runtime (via API boundary, not direct).
- Outbound: push subscribed `Event`s as they occur.
- Heartbeat/ping to detect dead connections; cleanup on disconnect.

## 14.3 SSE server
Module: `app/realtime/sse.py` (FastAPI `StreamingResponse`).
- Endpoint: `/events?conversation_id=&task_id=&token=&last_seq=`.
- Auth same as WS.
- Streams `Event`s for subscribed scopes; supports `last_seq` resume (replay gap).
- No inbound; clients needing commands must use WS or HTTP API.

## 14.4 Subscription scopes
- `conversation:<id>` — all tasks in conversation.
- `task:<id>` — single task events.
- UI subscribes per active task; server filters by scope + authz (user may only see own).

## 14.5 Why hybrid (decision 01 rationale)
- WS primary: needed for interactive control (interrupt/approve) and low-latency event push.
- SSE secondary: simpler fallback for environments/clients without WS, and for read-only monitoring without a persistent command channel.
- Operator may disable WS or SSE in `config/` (scoped), but at least one must remain enabled.

## 14.6 Command routing (WS inbound)
```
WS command frame → realtime/websocket → authz → API command handler (app.api) → runtime (pause/resume/interrupt/approve)
```
Realtime layer does NOT contain business logic; it forwards to API boundary (03). Approvals produce `permission_resolved` event.

## 14.7 Replay / resume
- On (re)connect, send events from `last_seq+1` (SSE) or last known seq (WS) via `event_bus.replay`.
- Ensures UI reconstructs task view after refresh/network drop.

## 14.8 Anti-patterns (locked)
- No business logic inside realtime layer (forward to API/runtime only).
- No provider/secret data in event payloads (Security 17).
- No event format divergence between WS/SSE (single `Event` model).
- Realtime must not import runtime core (03 inversion).

## 14.9 Phase-4 modules
- `app/realtime/websocket.py`, `app/realtime/sse.py`.
- Frontend: `lib/realtime.ts` (WS primary, SSE fallback) + Zustand store consumes events.
- Tests (22): auth reject, subscribe scope filter, WS command→API routing, SSE resume from last_seq, replay restores view, no-secret-leak.
