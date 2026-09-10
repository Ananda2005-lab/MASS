# 05 — Agent Runtime

Implements Phase 1 §5: Main Agent, Planner, Orchestrator, Executor, Verifier, Sub-Agent Manager, Tool Manager, Memory Manager. Core rule (Phase 1 §6, §14): sub-agents are managed, not independent. No external agent framework (Phase 1 §20.15).

## 5.1 Component map
| Component | Module | Responsibility |
|-----------|--------|----------------|
| Main Agent | `runtime/main_agent.py` | Understand intent, normalize goal, classify, hand to Planner |
| Planner | `runtime/planner.py` | Build/replan Plan (DAG) |
| Orchestrator | `runtime/orchestrator.py` | Execute plan, select sub-agents/tools/models, parallel/seq, verification points, recovery (see 06) |
| Executor | `runtime/executor.py` | Run a Step via Sub-Agent Manager / Tool Manager / Gateway |
| Verifier | `runtime/verifier.py` | Verify step + final result (see 12) |
| Sub-Agent Manager | `runtime/managers/sub_agent_manager.py` | Sub-agent registry/lifecycle/delegation (see 08) |
| Tool Manager | `runtime/managers/tool_manager.py` | Tool registry/permission/exec (see 11) |
| Memory Manager | `runtime/managers/memory_manager.py` | Context assembly/compression (see 10) |

## 5.2 Main Agent
Input: `TaskIntent.raw`, conversation context.
Steps (no code):
1. Receive raw instruction from API/Workspace.
2. Load recent conversation + memory (via Memory Manager).
3. Normalize raw → `goal` (clarify ambiguity; if critical ambiguity, emit `task_paused` for user input — do not guess locked decisions).
4. Classify `TaskType` (§4.4) using lightweight heuristic + optional LLM call through Gateway.
5. Extract `Constraint`s from user text (model/agent/tool/order/scope/permission). Constraints are guidance only (Phase 1 §9); security constraints always enforced.
6. Produce `TaskIntent`, create `Task` (status `created`), emit `task_created`.
7. Hand `TaskIntent` to Planner.

## 5.3 Planner
Input: `TaskIntent`.
Output: `Plan` (steps + edges + strategy + verification_points).
1. Decompose goal into candidate Steps (each with `goal`, candidate `tool_ids`, candidate `assigned_agent`, `input_refs`).
2. Order Steps into DAG: infer `Dependency` (blocks/feeds) from data flow and user `order` constraints.
3. Decide `strategy`: parallel where independent (no blocking dep, no shared mutable resource), else sequential/mixed (Phase 1 §17).
4. Mark `verification_points` (steps producing externally-observable artifacts: code, files, browser output, analysis conclusions).
5. Set `Plan.version=1`, `created_by = user` if user supplied plan else `agent`.
6. Emit `plan_updated`. Planner may be re-invoked by Orchestrator on failure (replan — see 06).

## 5.4 Executor
Input: a `Step` ready to run (all deps succeeded).
1. Resolve `input_refs` → `ContextBundle` via Memory Manager.
2. Request Orchestrator to select (a) sub-agent (or direct tool), (b) model(s), (c) tools — per §5.5 orchestration.
3. Invoke Sub-Agent Manager `run_sub_agent(role, SubAgentContext)` OR Tool Manager `invoke(tool_id, params)`.
4. Capture `SubAgentResult` / `ToolResult` → wrap as `Result`.
5. Emit `step_completed` / `step_failed`.
6. On failure: hand to Orchestrator recovery (§06.4).

## 5.5 Verifier (component)
- For each step at a `verification_point`, run `Verifier.verify(step, Result)` using category methods (see 12).
- For final result, run full verification before `task_completed`.
- Verifier returns `VerificationResult` (pass/fail + findings). On fail → Orchestrator recovery (§06.4). Verifier does not mutate state beyond recording the result.

## 5.6 Runtime lifecycle (state transitions)
```
Task.created
  → Main Agent: intent normalized
  → Planner: Plan built (status planning)
  → Orchestrator: dispatch steps (status executing)
      per step: Executor runs → Verifier checks
  → on all steps verified: final verify (status verifying)
  → task_completed | task_failed | task_paused
```
- `task_paused`: only for explicit user permission/approval (security) or genuine ambiguity (Main Agent). Never for arbitrary guesses.
- `task_failed`: after recovery budget exhausted (§06.4).

## 5.7 Failure modes handled (Phase 1 §16)
- LLM errors / rate limits / provider failures → Gateway retry/fallback (09); if exhausted → Orchestrator recovery.
- Model failures / invalid tool results / incorrect output → Verifier detects → recovery.
- Tool failures → Tool Manager error handling (11); if unrecoverable → recovery.
- Sub-agent failures → SubAgentContract.fallback_role or replan.
- Planning failures → replan with altered decomposition.

## 5.8 Non-goals (locked)
- Runtime must NOT call provider SDKs directly (Gateway only).
- Runtime must NOT invent sub-agent roles beyond the 14 defined (08).
- Runtime must NOT bypass Tool Manager permissions or Memory Manager context flow.
- Runtime must NOT implement UI (separate layer).

## 5.9 Phase-4 modules to create
`app/runtime/main_agent.py`, `planner.py`, `executor.py`, `verifier.py`; `app/runtime/managers/{sub_agent_manager,tool_manager,memory_manager}.py`. Each with unit tests (22) and contract adherence (04). No application logic outside these modules.
