# 08 — Memory and Context

Defines the context architecture. Source of truth: Phase 1 `08-memory-context.md` and spec §13. No implementation.

## Context layers (separated)
| Layer | Lifetime | Example |
|-------|----------|---------|
| Conversation context | per conversation | user messages, mode |
| Task context | per task | goal, constraints, plan |
| Execution context | per step | current step, assigned agent/tool |
| Tool results | per call | normalized tool output |
| Sub-agent results | per delegation | sub-agent output |
| Persistent memory | cross-task | durable facts, lessons |
| Temporary state | per session | in-flight caches, locks |

## Context assembly
The Memory Manager builds the context block sent to a model call:
1. Start from conversation context.
2. Inject task context (goal, constraints, plan state).
3. Inject relevant execution context (prior step results via `result_ref`).
4. Inject retrieved persistent memory (relevant-memory injection).
5. Apply prioritization + compression (below).

## Prioritization & compression
- **Prioritization:** most recent + directly dependent results rank highest; stale/irrelevant trimmed.
- **Compression:** when the assembled block nears a token budget, summarize older/lower-priority segments into compressed summaries.
- **Summarization:** produced by an LLM call through the Gateway (not stored as fact unless promoted to persistent memory).
- **Retrieval:** relevant-memory injection uses metadata/keyword lookup; **pgvector is optional** and used only when semantic retrieval is actually needed. Do not over-engineer vector memory at this stage.

## Short-term vs persistent
- Short-term: task/execution/temporary state → Redis + Task State (09, 14).
- Persistent: durable memory → PostgreSQL (14). Promotion from short-term to persistent requires an explicit write (no silent leakage).

## Data in / out
- In: context queries, result writes, memory writes.
- Out: assembled, prioritized, possibly-compressed context block for the Gateway request.

## Trigger policies (RESOLVED in Phase 2.1)
Exact compression/summarization/pruning/reconstruction triggers are locked in `decisions/05-context-management-decision.md`: compression at `compress_threshold` (~70% of model window), summarization on compression/step-completion, retrieval on assembly (pgvector optional), pruning by `retention_window`/superseded, reconstruction from Task State + Memory on switch/loss. Context is provider-agnostic so model/provider switches preserve logical state.
