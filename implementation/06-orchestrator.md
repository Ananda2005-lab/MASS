# 06 — Orchestrator

Implements Phase 1 §6, §9, §17. The central execution controller. Owns task decomposition execution, sub-agent/tool/model selection, ordering, parallel vs sequential, dependency handling, verification points, retry/recovery/replan (Phase 1 §6).

## 6.1 Responsibilities (locked, exclusive to Orchestrator)
- Determine execution order from `Plan.edges` (topological).
- Decide sequential vs parallel per `Plan.strategy` and live dependency state.
- Select, for each step:
  - sub-agent role (or direct tool) via Sub-Agent Manager,
  - model(s) via LLM Gateway router (09),
  - tool(s) via Tool Manager (11),
- Insert verification at `Plan.verification_points`.
- Manage retry strategy, fix strategy, re-plan strategy (§6.4).
- Honor user constraints (Phase 1 §9) without overriding security.

## 6.2 Execution loop (no code)
```
load Plan
ready = steps with all depends_on succeeded and status pending
while not terminal:
  if ready empty and incomplete remain: handle failure/recovery
  for each step in ready (respect strategy):
     if parallel allowed: schedule concurrently (asyncio.Task)
     else: run sequentially
     Executor.run(step) → Result
     if step in verification_points: Verifier.verify
     on success: mark succeeded, recompute ready
     on failure: recovery(step)
when all succeeded: final verify → task_completed / task_failed
```

## 6.3 Selection logic
| Selection | Source | Rule |
|-----------|--------|------|
| Sub-agent | Sub-Agent Manager | match `Step.goal` + `TaskType` to SubAgentRole; respect user `sub_agent` constraint; else default role for type |
| Model | Gateway.router | pass capability + constraints; router returns best candidate (09 decision 02) |
| Tool | Tool Manager | from `Step.tool_ids` filtered by permission + availability; user `tool` constraint honored |
| Order | Plan.edges + user `order` constraint | topological sort; user order overrides only if it preserves DAG validity (else warn, keep valid) |

## 6.4 Retry / Fix / Replan strategy (Phase 1 §15, §16)
On step failure (`ErrorInfo.retryable`):
1. **Retry:** up to `SubAgentContract.max_retries` (or tool retry policy). Same approach, fresh context. Increment `Step.retry_count`.
2. **Fix:** if Verifier identifies a specific defect (e.g., code error), dispatch a `fix` sub-agent / `debug` sub-agent with the failing artifact + diagnosis. (Not blind rerun.)
3. **Fallback:** if sub-agent has `fallback_role`, delegate there; if model exhausted, Gateway fallback (09).
4. **Replan:** if repeated failure or planning failure, call Planner again with failure context and altered decomposition (`Plan.version++`). User `order`/`scope` constraints re-applied.
5. **Exhausted:** mark `task_failed` with `ErrorInfo` + audit trail.
Recovery must be bounded (max total recovery attempts per task, configurable in `config/`). No infinite loops (Phase 1 §16 "designed for failure").

## 6.5 Parallel safety (Phase 1 §17)
- Only steps with no unresolved `blocks` dependency may run together.
- Shared mutable resources (same file, same external session) force sequential even if DAG allows parallel.
- Combine independent results after join (e.g., Research ∥ Analysis ∥ File-inspect → merge into context).
- Never parallelize where dependencies make it unsafe.

## 6.6 User-guided orchestration (Phase 1 §9)
- Parse `Constraint`s; inject into selection (§6.3). Invalid constraints (e.g., request to bypass security, use disallowed provider bypass) are rejected with `task_paused`/explanatory event, not silently ignored.
- User may specify step-first, avoid-capability, particular model/agent/tool — all routed through Orchestrator, all subject to permission layer.

## 6.7 Phase-4 module
`app/runtime/orchestrator.py` + tests covering selection, parallel scheduling, retry/fix/replan, constraint handling. Orchestrator must be the ONLY module performing these decisions.