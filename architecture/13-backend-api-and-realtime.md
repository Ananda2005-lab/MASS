# 13 — Backend API and Realtime

Defines backend boundaries around FastAPI. Source of truth: Phase 1 `02-architecture.md` and spec §18. No implementation (no endpoints coded).

## API boundary groups
| Group | Responsibility |
|-------|----------------|
| Conversations | create/list/get conversation; mode selection |
| Tasks | create task from instruction/workspace action; get status |
| Instruction execution | submit goal, receive task lifecycle |
| Workspace operations | surface actions (files, research, results) -> tasks |
| Agent state | read agent/sub-agent execution state (UI-visible only) |
| Task state | read task/step state, plan |
| Tools | list available tools, request tool (permission-gated) |
| Results | fetch result payloads by result_ref |
| Configuration | provider profiles, permissions (operator-scoped) |

## Request / response concept (per group)
For each group the API defines:
- **request concept:** the input shape (e.g., InstructionExecutionRequest = { goal, constraints, mode }).
- **response concept:** the immediate ack (task_id) + subsequent streamed events.
- **authentication boundary:** caller identity verified (15).
- **authorization boundary:** caller permitted for the operation/scope.
- **realtime relationship:** long-running updates delivered via Realtime, not polling.

## Realtime usage (RESOLVED in Phase 2.1 — Hybrid)
Selected architecture: **WebSocket (primary, bidirectional) + SSE (secondary, read-only observers)** — see `decisions/01-realtime-decision.md`. Both transports emit the same event vocabulary from 09-task-state-and-events.md.
- WebSocket carries server→client events AND client→server command frames (cancel, approve, retry, subscribe); one authenticated connection per session.
- SSE is a read-only event stream for observer clients that never issue commands.
- Realtime connection is authenticated; client subscribes to `conversation_id` / `task_id`.
- Realtime carries only UI-visible event payloads (no secrets/internal reasoning).

The API exposes both command (request/response) and event (push) surfaces so either transport layers cleanly on top in Phase 3.

## Constraints
- Frontend never calls the Agent Runtime directly; only via these boundaries.
- All model/tool access inside the backend remains behind Gateway/Tool Manager.
