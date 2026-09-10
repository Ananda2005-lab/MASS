# 15 — Backend API

Implements Phase 1 §4 (API/Session Layer) and §18. FastAPI routers are the HTTP boundary (Layer L2, 03). They authenticate, validate contracts (04), and delegate to runtime/state — never contain orchestration logic.

## 15.1 Routers (module map, 02)
| Router | Endpoints | Purpose |
|--------|-----------|---------|
| `conversations.py` | `POST /conversations`, `GET /conversations/{id}` | conversation lifecycle |
| `tasks.py` | `POST /tasks`, `GET /tasks/{id}`, `GET /tasks/{id}/state` | task CRUD + state |
| `instruction.py` | `POST /instruction` (Mode A) | submit natural-language instruction |
| `workspace.py` | `POST /workspace/action`, `GET /workspace/{task_id}` (Mode B) | workspace interactions |
| `tools.py` | `GET /tools`, `POST /tools/{id}/invoke` (if direct) | tool catalog/inspect |
| `results.py` | `GET /tasks/{id}/results`, `GET /artifacts/{id}` | fetch results/artifacts |
| `config.py` | `GET /config/modes`, capability flags | UI capability discovery |

## 15.2 Key endpoints (contract-shaped)
- `POST /instruction` body: `{ conversation_id, raw, constraints?, mode:"instruction" }` → creates `Task` via Main Agent; returns `task_id` + initial events (also pushed via realtime).
- `POST /workspace/action` body: `{ task_id, action, payload }` → Mode B interaction; returns result/event.
- `GET /tasks/{id}/state` → current `Task` + `Plan` + step statuses (for UI restore).
- `GET /tasks/{id}/results` → list `Result` + `Artifact`s.
- `POST /tasks/{id}/approve` (permission resolve) → `permission_resolved` event (used by realtime command too).

## 15.3 Request/response rules
- All bodies validated against contracts in `app/core` (pydantic). Invalid → 422.
- All responses are JSON using the same contracts (04) to avoid drift with frontend `lib/types.ts`.
- Async handlers (FastAPI); long work delegated to runtime (background task / orchestrator), not blocking the request.
- Errors returned as `ErrorInfo`-shaped JSON with proper HTTP status; never leak secrets.

## 15.4 Authn/Authz integration (see 17)
- Every endpoint requires valid token (17.1). User may only access own conversations/tasks.
- Permission-dependent actions (approve, invoke risky tool) checked via Security layer.
- Audit log written for each mutating call (17.4).

## 15.5 Realtime bridge
- API mutations publish `Event`s via `event_bus` (13.4); Realtime (14) streams them.
- API does not push WS directly; it relies on event_bus → realtime fan-out (03 inversion preserved).

## 15.6 Anti-patterns (locked)
- No orchestration/planner/orchestrator logic inside routers (delegate to runtime).
- No provider SDK calls in API layer (Gateway only).
- No secrets in responses/logs (Security 17).
- No separate event schema (use 04/13 envelope).

## 15.7 Phase-4 modules
- `app/api/*.py` (7 routers) + `app/main.py` (app factory, lifespan wiring state/event_bus/gateway).
- Validation via `app/core` pydantic models (mirror frontend types).
- Tests (22): each endpoint validates contracts, auth rejects unauthorized, delegates correctly, returns contract-shaped responses, audit logged.
