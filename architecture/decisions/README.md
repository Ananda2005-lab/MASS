# Architecture Decisions — Phase 2.1

This directory resolves the five architectural decisions that Phase 2 intentionally left OPEN. Each decision follows the Phase 2.1 process (read → constrain → alternatives → compare → select → reason → define → tradeoffs → consistency). No implementation is performed; only architecture is locked.

## Decision index

| # | Area | Selected architecture | Status | Depends on |
|---|------|-----------------------|--------|-----------|
| 01 | Realtime | **Hybrid**: WebSocket (primary, bidirectional) + SSE (secondary, read-only observers) | RESOLVED | 09, 11, 12 |
| 02 | LLM Router | **Weighted candidate scoring** over (Provider, Model, CredentialProfile) tuples with fallback/cooldown | RESOLVED | 07, 14 |
| 03 | Verification | **Per-category verification methods** + bounded verify/diagnose/fix loop | RESOLVED | 05, 10 |
| 04 | Sub-agent contracts | **Common SubAgentContract schema** + Orchestrator-selected, context-sliced execution | RESOLVED | 03, 05, 08 |
| 05 | Context management | **Threshold-triggered compression/summarization/pruning + Task-State reconstruction** | RESOLVED | 08, 09 |

## Short rationale (one line each)
- **01:** WebSocket carries commands + events + cancellation on one connection; SSE gives cheap read-only observers. Both emit the same event vocabulary (09).
- **02:** Deterministic, reproducible selection from live capability/health/quota state; free-quota profiles preferred while available; no provider bypass.
- **03:** Verification method is chosen by output category (text/code/data/research/file/tool/multi-step/external/artifact), not a generic LLM yes/no.
- **04:** One contract for all 14 runtime sub-agents; Orchestrator selects, slices context, aggregates results; general-purpose, not coding-only.
- **05:** Context lives in Task State + Memory (provider-agnostic); compression/summarization/pruning trigger on token thresholds; reconstruction restores logical context on any model/provider switch.

## Affected Phase 2 documents (updated)
- `07-llm-gateway-and-router.md` — OPEN note replaced by reference to decision 02.
- `08-memory-and-context.md` — trigger policies added, referencing decision 05.
- `09-task-state-and-events.md` — unchanged (event vocabulary is the contract both transports use).
- `10-verification-and-recovery.md` — verification methods referenced to decision 03.
- `13-backend-api-and-realtime.md` — OPEN transport resolved to decision 01.
- `05-sub-agent-system.md` — common contract referenced to decision 04.
- `architecture/README.md` — OPEN ARCHITECTURE DECISIONS marked RESOLVED.

## Consistency status
See `consistency-audit.md`. No contradictions remain; no decision is still genuinely OPEN.
