# 03 — Module Boundaries

Exact software layers and their contracts. Prevents circular dependencies and enforces the locked separation (Phase 1 §4, §5).

## Layers (top → bottom)
| # | Layer | Modules | Responsibility |
|---|-------|---------|----------------|
| L1 | UI | `frontend/app`, `frontend/components`, `frontend/store` | Render Instruction/Workspace; send commands; render events |
| L2 | API | `app/api` | Authn/authz, request/response contracts, realtime bridge |
| L3 | Realtime | `app/realtime` | WS/SSE transport, event envelope, replay |
| L4 | Application | `app/runtime` (Main Agent, Planner, Orchestrator, Executor, Verifier) | Task lifecycle, orchestration |
| L5 | Managers | `runtime/managers` (Sub-Agent, Tool, Memory) | Sub-agent lifecycle, tool exec+perms, context |
| L6 | Gateway | `app/gateway` | Provider/model abstraction + routing |
| L7 | Verification | `app/verification` | Verify/diagnose/fix decisions |
| L8 | State/Events | `app/state` | Task state machine + event bus |
| L9 | Persistence | `app/persistence` | PostgreSQL/Redis/pgvector entities |
| L10 | Cross-cutting | `app/security`, `app/observability`, `config` | Auth, perms, secrets, logs, traces, config |

## Per-layer detail
| Layer | Inputs | Outputs | Dependencies | State owned |
|-------|--------|---------|--------------|------------|
| UI | user actions, events | commands, rendered state | L2/L3 | local UI state (Zustand) |
| API | HTTP/WS frames | runtime calls, events | L4,L8,L10 | session identity |
| Realtime | subscribed scopes | event frames | L8,L10 | connection registry |
| Application | TaskIntent | step dispatch, final result | L5,L6,L7,L8 | current task lifecycle |
| Managers | delegation/tool/context req | results | L6,L8,L9 | sub-agent/tool/context records |
| Gateway | LLMRequest | LLMResponse | L9(config), L10 | health/quota/cooldown |
| Verification | artifact+requirement | verdict | L5(tools) | verification records |
| State/Events | state mutations | events | L9 | task/event state |
| Persistence | entities | rows | DB | durable data |
| Cross-cutting | none | services | all | secrets, logs |

## Communication boundaries
- UI → API/Realtime only (L1 may not call L4–L9 directly).
- API/Realtime → Application (L2/L3 call L4), never skip to L6/L7.
- Application → Managers/Gateway/Verification (L4 uses L5,L6,L7), not L9 directly (goes via State).
- Gateway → Provider adapters only; adapters are the sole provider SDK holders.
- Managers → State (L8) for persistence, not directly to DB model classes.

## State ownership
- **Immutable:** Task id, Conversation id, creation timestamp, locked contracts.
- **Mutable (in-task):** current step, plan edges, step status.
- **Persisted:** Task State (PostgreSQL), live state (Redis), events (PostgreSQL + Redis stream).
- **Transient:** in-flight LLM/tool call handles, WS connections.

## Anti-circular rules
- `core/` (contracts) depends on nothing except stdlib/pydantic.
- Lower layers never import upper layers (no L6→L4, no L9→L4).
- `app.api` and `app.realtime` are entrypoints that *import* runtime; runtime does not import them.
- Provider SDKs confined to `app/gateway/*/adapters`; a failed adapter cannot crash core (errors returned as typed failures).
