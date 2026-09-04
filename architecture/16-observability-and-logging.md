# 16 — Observability and Logging

Defines observability requirements. Source of truth: Phase 1 `13-testing-strategy.md` and spec §16. No implementation.

## Goals
Be able to answer: what the agent did, why a sub-agent was selected, which tool was used, which model/provider was used, what failed, what was retried, what was verified, why the final result was accepted.

## Required records
| Record | Captures |
|--------|----------|
| Structured logs | component-level events with task_id/step_id |
| Execution traces | Orchestrator -> Sub-Agent -> Tool -> Gateway spans |
| Task events | the vocabulary in 09-task-state-and-events.md |
| LLM usage records | model, provider, credential profile, tokens, latency, cost |
| Tool execution records | tool, category, input hash, status, duration |
| Error records | typed failure class, step, retry/replan link |

## Structured log contract
Every log line: `{ ts, level, task_id, step_id, component, action, status, meta }`. No secrets in `meta`.

## Tracing
- Each Step starts a trace; sub-agent and tool calls are child spans.
- Gateway calls are spans carrying model/provider (not keys).
- Verifier decisions recorded with the verification_requirement and verdict.

## Privacy
- No raw credentials, no full tool payload secrets, no internal reasoning text in logs/events.
- Sensitive outputs referenced by `result_ref`, not inlined.

## Consumers
- Operators: debugging, auditing, cost/quota monitoring.
- UI: only derived/UI-visible state via events (09, 13).
