# Step 1 — Agent → Tool Execution Loop: Implementation Report

**Scope:** Implement ONLY the Agent → Tool Execution Loop. No real LLM providers, no UI,
no Workspace panels, no semantic memory, no auth completion, no new architecture.

**Status:** ✅ Complete. 10/10 focused tests pass. 74/76 existing regression tests pass
(the 2 failures are pre-existing and unrelated — see §7).

---

## 1. Files changed

| File | Change |
|---|---|
| `backend/app/runtime/tool_call.py` | **NEW** — `ToolCallDispatcher`: the Agent→Tool loop. |
| `backend/app/runtime/managers/tool_manager.py` | Added `get_tool(tool_id)` (registry read). |
| `backend/app/runtime/managers/sub_agent_manager.py` | Added `dispatcher` (ToolCallDispatcher) + `call_tool(role, invocation)` approved entry point. |
| `backend/app/runtime/executor.py` | Wired planned step tool-ids through the registry (non-fatal); imports `CONTRACTS`, `ToolInvocation`. |
| `backend/app/gateway/adapters/fake.py` | Fake adapter can emit a deterministic `tool_call` decision via `request.params["tool_call"]`. |
| `backend/tests/test_tool_call_loop.py` | **NEW** — focused tests A–J. |

No contracts redesigned. `ToolInvocation` (request) and `ToolResult` (result/error/status)
from the existing core contract are reused as-is.

---

## 2. Existing components reused

- **`ToolManager.invoke`** — single registry + permission + execution path (NOT bypassed).
- **`ToolRegistry`** — tool lookup (`get_tool`).
- **`PermissionChecker`** — enforces `fs:write / exec:terminal / exec:sandbox / network`.
- **`SubAgentContract.capabilities`** — authoritative role→tool restriction.
- **Native tools** — `files.read/list/write`, `calculator.eval`, `terminal.exec`, `browser.navigate`.
- **Events** — `TOOL_INVOKED`, `TOOL_RESULT`, `PERMISSION_REQUESTED`, `PERMISSION_RESOLVED`.
- **`ToolInvocation` / `ToolResult`** — request/result contract (already had id, params, ticket, timeout / status, output, error).
- **`EventBus`** — existing publish path.

---

## 3. Exact Agent → Tool execution flow implemented

```
Agent / Executor
   → SubAgentManager.call_tool(role, ToolInvocation)        # approved runtime path
      → ToolCallDispatcher.dispatch(role, invocation)
         1. emit TOOL_INVOKED            (requested + started)
         2. Registry lookup  -> unknown_tool FAILURE (no execution)
         3. Role-capability  -> role_not_allowed FAILURE (no execution)   [SubAgentContract]
         4. Argument validation (input_schema.required) -> invalid_arguments FAILURE (no execution)
         5. ToolManager.invoke(invocation)                               [registry + permission + run]
              - Permission denied  -> PERMISSION_DENIED (+ PERMISSION_REQUESTED/RESOLVED events)
              - Execution          -> SUCCESS / FAILURE / TIMEOUT
         6. emit TOOL_RESULT    (final status + error_code)
         → ToolResult returned to the agent / execution context
```
After a successful (or failed) tool call, the step result is returned and the
**Orchestrator continues** to the next step / completes the task (existing rules, unchanged).

The Executor also now routes each step's planned `tool_ids` (from the Planner) through this
same path (`_run_planned_tools`), so the agent's plan can actually use tools end-to-end.
This is **non-fatal**: unknown tools are skipped and tool failures are structured — they do
not override the sub-agent's reasoned result, so the existing pipeline behavior is preserved.

---

## 4. Permission / validation behavior

- **Permission:** tools needing `fs:write`, `exec:terminal`, `exec:sandbox`, `network`
  require an approved `permission_ticket`. Without it, `ToolManager` returns
  `PERMISSION_DENIED` and the tool is NOT executed. The dispatcher records
  `PERMISSION_REQUESTED` + `PERMISSION_RESOLVED(allowed=false)` events.
- **Argument validation:** before execution, `tool.metadata.input_schema.required` is checked.
  Missing required params → `invalid_arguments` failure, tool NOT executed.
- **Role restriction:** the requested `tool_id` must be in `SubAgentContract.capabilities` for
  the calling role. Otherwise → `role_not_allowed`, tool NOT executed. This stays authoritative.

---

## 5. Failure behavior (structured, never a crash)

| Case | Result status | error.code | Tool executed? |
|---|---|---|---|
| Unknown tool | FAILURE | `unknown_tool` | No |
| Role not allowed | FAILURE | `role_not_allowed` | No |
| Invalid arguments | FAILURE | `invalid_arguments` | No |
| Permission denied | `permission_denied` | (permission) | No |
| Tool throws (e.g. file missing) | FAILURE | `file_not_found` / etc. | No (raised inside handler, caught) |
| Timeout (if supported) | `timeout` | `timeout` | No (wrapped in `asyncio.wait_for`) |

All failures become `ToolResult` objects with an `error` dict + events — no uncaught exceptions.

---

## 6. Tests added (`tests/test_tool_call_loop.py`)

A. valid tool request → executes → result returns  ✅
B. unknown tool → rejected, not executed  ✅
C. invalid arguments → rejected, not executed  ✅
D. permission denied → rejected, not executed (+ event)  ✅
E. tool throws → structured failure, no crash  ✅
F. successful result → execution can continue (no loop)  ✅
G. role restriction → unauthorized sub-agent blocked  ✅
H. events/state → `TOOL_INVOKED` + `TOOL_RESULT` produced  ✅
I. deterministic tool-call decision via the Fake Gateway/adapter, then executed  ✅
J. timeout support (wrapped execution)  ✅

---

## 7. Test results

- Focused suite: **10 passed**.
- Full regression: **74 passed, 2 failed**.

The 2 failures are **pre-existing and unrelated to Step 1**:
1. `test_consistency_audit.py::test_two_mode_pages_exist_and_distinct` — references the old
   `(instruction)` / `(workspace)` folder names; broken by the frontend route-rename done in
   the *previous* session, not this step. (Needs a one-line path update to `app/instruction`,
   `app/workspace` — outside Step 1 scope.)
2. `test_persistence.py::test_event_repo_append_replay` — `test_aap.db` is not cleaned between
   runs, so a leftover `t1` event from prior runs accumulates. Test-isolation issue in the test
   itself; `EventRepo`/persistence code was NOT touched by this step.

No genuine regression was introduced by this change (the runtime e2e, sub-agent, api, and
architecture-consistency imports checks all still pass).

---

## 8. Limitations

- The Fake LLM still produces synthetic text; a tool call is only "decided" when the caller
  explicitly requests it (tests drive `call_tool` directly, and the Planner's `tool_ids` are
  routed). The 14 sub-agent handlers remain LLM-reasoning-first; they do not yet auto-request
  tools (that is future work, not in Step 1 scope).
- Tool arguments in the live pipeline come from the Planner's `tool_ids` only (no param values
  yet), so in-pipeline calls mostly exercise the failure/structure path; real param plumbing is
  a later step.
- Timeout is enforced via `asyncio.wait_for` around `ToolManager.invoke`; only tools that honor
  `timeout_ms` internally (e.g. terminal) get finer-grained control.
- Permission approval (user clicking "Approve" in the UI) is not yet wired end-to-end to the
  running `PermissionChecker` instance; the denial path is fully implemented and tested.

---

## 9. Confirmation — no real LLM providers added

Only the existing **Fake adapter** is used. The Fake adapter was extended *only* to optionally
emit a deterministic `tool_call` decision via `request.params` — no network, no SDK, no
credentials. No OpenAI/Anthropy adapters were created. `gateway/bootstrap.py` is unchanged
except the already-present Fake provider.

## 10. Confirmation — locked architecture NOT redesigned

- No changes to architecture, module boundaries, orchestration design, `SubAgentContract`,
  permission model, or LLM Gateway interface.
- The new `ToolCallDispatcher` is a thin wiring layer that *uses* the existing `ToolManager`
  (registry + permission + execution) and `SubAgentContract`; it does not replace them.
- `ToolInvocation` / `ToolResult` from the existing core contract are reused unchanged.
- Existing events are reused; no second event system was created.

---

**Step 1 is complete. Awaiting explicit approval before Step 2. No further work started.**
