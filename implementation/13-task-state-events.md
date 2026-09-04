# 13 — Task State & Events

Implements Phase 1 §14 (Task State), §4 (execution flow) and core `Event` contract (§4.24). Persistent task state for long-running/recoverable execution (Phase 1 §14). Event bus for realtime + replay.

## 13.1 Task State (Phase 1 §14)
Must contain: `Task ID, User, Conversation, Plan, Current Step, Tool Calls, Agent State, LLM Calls, Results, Errors, Final Result`.
Mapped to contracts: `Task` (§4.1) + `Plan` (§4.5) + `Step`/`Result`/`ErrorInfo` (§4.6–4.11) + `LLMResponse`/`ToolResult` logs. Stored in PostgreSQL (durable) + Redis (live) per 10.1/16.

## 13.2 State store interface (no code)
- `save_task(Task)`, `load_task(id)`, `update_step(step)`, `append_result(result)`, `append_error(err)`, `append_llm_call(resp)`, `append_tool_call(res)`, `set_final(result)`.
- All mutations produce an `Event` (§13.4) for audit + realtime.
- Live state in Redis for fast access; durable flush to PostgreSQL (16).

## 13.3 State machine (authoritative)
```
created
  → planning   (Plan built)
  → executing  (steps dispatched)
  → verifying  (final verification)
  → completed | failed
  ↺ paused    (user approval / ambiguity) → resumed → executing
```
Transitions emitted as `task_*` events. Invalid transitions rejected.

## 13.4 Event bus
Module: `app/state/event_bus.py`.
- Publishes `Event` (§4.24) to: (a) PostgreSQL event log, (b) Redis stream (realtime subscribers), (c) observability sink.
- Subscribers: Realtime (WS/SSE clients), audit log, analytics.
- `seq` is monotonic per task for ordering + replay.
- Replay: given `task_id`, return ordered events (used by UI restore + reconstruction 10.7).

## 13.5 Event types (§4.24)
`task_created, plan_updated, step_started, step_completed, step_failed, tool_invoked, tool_result, llm_called, llm_result, sub_agent_selected, sub_agent_result, verification_started, verification_result, permission_requested, permission_resolved, task_paused, task_resumed, task_completed, task_failed, error, info`.
Each event carries `actor` (system/user/agent/tool/llm) + `payload` (JSON).

## 13.6 Event contract rules
- Events are immutable once written (append-only log).
- `payload` must be serializable; references use `Ref` (§4.17), not embedded large blobs.
- `seq` assigned by event bus; consumers must handle out-of-order arrival by `seq`.
- No PII/secrets in `payload` (Security 17 scrubs).

## 13.7 Recovery via state + events
- On restart: rebuild working context from Task State (10.7) + replay events to restore UI/runtime view.
- Idempotency: event handlers must be safe to replay (use `seq` + idempotency keys).

## 13.8 Anti-patterns (locked)
- No task state kept only in memory (must persist for recovery, Phase 1 §14).
- No event mutation after write (append-only).
- No secrets in events (Security 17).
- Runtime must not import `app.realtime`/`app.api`; it publishes events, they subscribe (03).

## 13.9 Phase-4 modules
- `app/state/task_state.py` (store interface + machine), `app/state/event_bus.py` (publish/subscribe/replay).
- Integration: every runtime mutation calls state + event_bus.
- Tests (22): state machine transitions valid/invalid, event ordering, replay restores state, no-secret-in-payload (scan).
