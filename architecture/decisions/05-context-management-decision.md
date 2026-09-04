# Decision 05 — Memory / Context Management

## Selected architecture: TASK-STATE-BACKED CONTEXT with THRESHOLD-TRIGGERED COMPRESSION
Context is **provider-agnostic** and lives in Task State + Memory, not inside any LLM call. Assembly slices the right context per Step; compression/summarization/pruning trigger on token thresholds; reconstruction restores logical context on any model/provider switch.

## Context layers (from 08)
conversation, task, execution, tool results, sub-agent results, persistent memory, temporary state.

## Priority
1. Current Step input + its direct dependencies' `result_ref`
2. Task goal + Plan + constraints
3. Recent conversation turns
4. Retrieved persistent memory (relevant)
5. Older/lower-priority history (compressible)

## Context assembly
Memory Manager builds the block: conversation → task → execution → retrieved memory → (compression if over threshold).

## Triggers (exact policy)
| Trigger | Condition | Action |
|---------|-----------|--------|
| Compression | assembled tokens > `compress_threshold` (e.g., 70% of model window) | summarize oldest low-priority segments into compressed summary |
| Summarization | on compression, or on Step completion for verbose outputs | LLM-generated summary via Gateway; stored, not promoted to fact unless explicit |
| Retrieval | on assembly | metadata/keyword lookup of persistent memory; **pgvector only if semantic retrieval needed** (optional, 08) |
| Pruning | segment older than `retention_window` OR explicitly superseded (e.g., obsolete plan version) | drop from active context (kept in Task State/Memory for reconstruction) |
| Reconstruction | context loss / compaction / model or provider switch | rebuild from Task State (results, plan) + persisted Memory; logical context preserved |

## Compression / summarization / pruning / reconstruction detail
- **Compression:** shrink without losing actionable facts; keep references to `result_ref` so detail is re-fetchable.
- **Summarization:** produce a compact narrative of completed work; used when re-entering a long task.
- **Pruning:** never deletes source data — only removes from the active window; source remains in PostgreSQL/Redis.
- **Reconstruction:** because context is derived from Task State + Memory (both provider-agnostic), switching LLM/provider/account does NOT destroy logical task context (decision 02 continuity holds).

## Handoff between sub-agents
Each sub-agent receives only its relevant slice (Memory Manager assembles per Step via `context_requirements` from contract 04). No sub-agent sees another's full raw context unless required.

## Handoff between model/provider switches
Context is plain text/structured (no provider-specific formatting). On switch, Gateway call is rebuilt from the same Task State; the new model receives equivalent logical context.

## Persistence / restoration
- Short-term (task/execution/temp) → Redis + Task State.
- Persistent → PostgreSQL.
- Restoration = reconstruction from above on reconnect/restart.

## Tradeoffs
- Threshold-triggered compression avoids unbounded growth without premature summarization.
- pgvector stays optional; keyword/metadata retrieval covers most cases, keeping the stack simple until semantic need is proven (08).
- Reconstruction relies on disciplined `result_ref` writing — enforced by Task State design (09).
