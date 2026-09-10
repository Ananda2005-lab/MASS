# 10 — Memory & Context

Implements Phase 1 §13 and Phase 2.1 decision 05 (Context Management). Architectural boundaries for conversation context, task state, previous results, important memory, tool results, agent state. Threshold-triggered compression + Task-State reconstruction. Provider-agnostic (works with any LLM). Do not pre-build complex memory unless specified (Phase 1 §13).

## 10.1 Memory boundaries (Phase 1 §13)
| Boundary | Content | Store | Lifecycle |
|----------|---------|-------|-----------|
| Conversation context | recent turns | Redis (live) + PostgreSQL (durable) | per conversation |
| Task state | plan/steps/status/results | Redis (live) + PostgreSQL (durable) | per task |
| Previous results | step results/artifacts | PostgreSQL | per task |
| Important memory | user facts, pinned notes | PostgreSQL | long-lived |
| Tool results | tool outputs | Redis (short) + PostgreSQL | per invocation |
| Agent state | sub-agent run state | Redis (live) | per run |

## 10.2 ContextBundle (decision 05, §4.25)
`ContextBundle = { layers: list[ContextLayer], assembled_at, token_estimate, compressed: bool }`.
Each `ContextLayer`: `{ id, kind, source_ref, content_ref, tokens, importance (0..1), created_at }`.
Kinds: `conversation, task_state, result, memory, instruction, tool_result, agent_state`.

## 10.3 Context assembly (Memory Manager)
Input: `SubAgentContext` request (what layers needed).
Steps (no code):
1. Gather requested layers from stores (Redis first, PostgreSQL fallback).
2. Estimate `tokens` per layer (cheap tokenizer; exact not required).
3. Compute `importance` (recency, explicit pin, type weight).
4. Build `ContextBundle`, sorted by relevance for the request.
5. If `token_estimate` exceeds threshold → trigger compression (§10.4) then re-estimate.
6. Return bundle + `token_estimate`.

## 10.4 Compression (decision 05)
Trigger: `token_estimate > config.context.threshold` (e.g., 70% of model context window).
Methods (provider-agnostic):
- **Summarization:** condense low-importance layers into a summary layer (via Gateway chat call, generic prompt). Original retained in store; summary replaces in bundle.
- **Truncation/eviction:** drop oldest lowest-importance `conversation`/`tool_result` layers first.
- **Relevance filtering:** keep only layers referenced by `input_refs`/current step.
`compressed=true` recorded; compression is reversible at store level (originals kept).

## 10.5 Task-State reconstruction (decision 05)
On context loss/restart: rebuild working context from: (a) durable Task State in PostgreSQL, (b) persisted step results/artifacts, (c) important memory. No reliance on in-memory-only state. Enables resumable/recoverable execution (Phase 1 §14).

## 10.6 Importance signals
- `instruction`: high (system/task goal).
- `task_state` / `result`: medium-high (needed for continuity).
- `tool_result` / `conversation` (old): low (evictable).
- pinned `memory`: user-controlled high.

## 10.7 Reconstruction procedure (no code)
```
on resume(task_id):
  load Task (PostgreSQL) → plan, status, current_step
  load step results/artifacts (PostgreSQL)
  load important memory (PostgreSQL)
  load live state if present (Redis) else from PostgreSQL
  assemble ContextBundle for current_step
  continue orchestration from current StepStatus
```

## 10.8 Non-goals / locked
- No semantic/vector memory required initially (pgvector optional, Phase 1 §13). If added later, it is another `ContextLayer.kind` (e.g., `memory` with vector lookup) — no core rewrite.
- Compression must not delete durable data; only adjusts what is sent in a bundle.
- Memory Manager must not call provider SDKs directly (uses Gateway for summarization).

## 10.9 Phase-4 modules
- `app/memory/assembler.py` (build ContextBundle), `compressor.py` (threshold + methods), `store.py` (layer read/write across Redis/PostgreSQL).
- `runtime/managers/memory_manager.py` (facade used by runtime).
- Implementation note: `context_window` for compression threshold comes from Gateway Model info (09); Memory Manager queries Gateway, does not hardcode.
- Tests (22): assembly correctness, threshold trigger, compression preserves originals, reconstruction restores Task continuity.
