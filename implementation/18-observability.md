# 18 — Observability

Implements Phase 2 §16 (Observability & Monitoring) and cross-cutting layer (03). Structured logging, tracing, metrics for debugging/audit/operator visibility. No secrets in logs (17.3).

## 18.1 Logging
- `app/observability/logging.py`: structured JSON logs (level, ts, service, task_id, step_id, actor, message, metadata). Use stdlib `logging` with JSON formatter or `structlog`.
- Correlation: every log carries `trace_id` + `task_id` for cross-component follow.
- Redaction: secret patterns stripped before emit (Security 17.3).
- Levels: debug (dev), info (default), warn, error. Sensitive data never at info+.

## 18.2 Tracing
- `app/observability/tracing.py`: span per operation (LLM call, tool invoke, sub-agent run, step exec). Spans linked to `trace_id`.
- Captures duration, status, token usage (from `LLMResponse.usage`), retries.
- Exported to operator sink (e.g., OTLP) — sink choice operator-scoped (config), not a locked dependency.

## 18.3 Metrics (operator-visible)
- Per-task: steps, duration, retries, verification passes/fails.
- LLM: calls, tokens, cost units, latency, errors per provider/model (feeds Gateway health/quota 09.6).
- Tools: invocations, failures, permission denials.
- Realtime: connections, events pushed.
Metrics derived from events (13.4) + spans; no separate instrumentation needed in business logic.

## 18.4 Audit integration
- Audit log (17.4) is a specialized observability sink: append-only, compliance-focused.
- Observability must not alter business state; read-only consumers of events/spans.

## 18.5 Anti-patterns (locked)
- No secrets in logs/traces (17.3).
- No business-logic side effects in observability.
- No provider SDK calls here (Gateway only).

## 18.6 Phase-4 modules
- `app/observability/logging.py`, `tracing.py`; config in `config/observability.yaml` (levels, sink).
- Tests (22): redaction of secrets, trace_id propagation, metrics computed from events.