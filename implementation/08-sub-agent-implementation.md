# 08 — Sub-Agent Implementation (Common Contract)

Implements Phase 1 §7, §8, §14 and Phase 2.1 decision 04. All 14 runtime sub-agents share one `SubAgentContract` (§4.18). Sub-agents are managed, not independent (Phase 1 §6, §14). No new roles beyond the 14 (Phase 1 §20).

## 8.1 Sub-Agent Manager
Module: `app/runtime/managers/sub_agent_manager.py`.
Responsibilities (exclusive):
- Registry: map `SubAgentRole` → implementation + `SubAgentContract`.
- Lifecycle: instantiate per delegation (stateless workers; state lives in Task State, not the agent).
- Delegation: `run_sub_agent(role, SubAgentContext) → SubAgentResult`.
- Monitoring: record start/end, token usage, status; emit `sub_agent_selected`, `sub_agent_result`.
- Evaluation: check `SubAgentResult.status`; on failure apply `fallback_role` or return to Orchestrator recovery (06.4).
- Model selection: ask Gateway router for a model matching `capability` + contract `model_preferences` + user constraints.

## 8.2 Common contract (decision 04, §4.18)
Every sub-agent implements:
```
run(context: SubAgentContext) -> SubAgentResult
```
with shared `input_schema`, `output_schema`, `capabilities` (allowed tools), `model_preferences`, `max_retries`, `verification_aware`, `fallback_role`.
- `SubAgentResult.rationale` (str) is REQUIRED — proves contextual reasoning (Phase 1 §8), not just raw output.
- A Reader is not "read file and return text"; it must understand context for its assigned task. Same for Writer/Debug/Fix/Research/Analysis/Testing/Review (Phase 1 §8).

## 8.3 The 14 roles (locked)
research, deep_reading, analysis, planning, coding, writing, debug, fix, review, testing, browser, file, verification, security.

## 8.4 Registry structure
| Role | Primary capability | Allowed tools (initial) | fallback_role |
|------|-------------------|-------------------------|---------------|
| research | web research | web, search, browser | analysis |
| deep_reading | comprehension | files, browser | research |
| analysis | synthesize | files, calculator, browser | research |
| planning | plan | files | analysis |
| coding | generate code | code, terminal, files | debug |
| writing | generate text | files | analysis |
| debug | diagnose | code, terminal, files | fix |
| fix | correct | code, terminal, files | coding |
| review | assess | files, code | analysis |
| testing | test | code, terminal | debug |
| browser | web automation | browser, web | research |
| file | file ops | files | — |
| verification | verify | files, code, terminal | review |
| security | permission/audit | files, terminal, code | review |

Tool categories per Phase 1 §11. Exact tool ids defined in 11.

## 8.5 Delegation flow (no code)
```
Orchestrator → SubAgentManager.run_sub_agent(role, ctx)
  resolve contract
  request model from Gateway (capability, prefs, constraints)
  assemble context via Memory Manager
  call sub-agent run()
  capture SubAgentResult (incl rationale)
  if verification_aware: self-verify internally
  emit sub_agent_result
  on failure: fallback_role or return ErrorInfo to Orchestrator

## 8.6 Per-role responsibility sketch (must satisfy Phase 1 §8 quality bar)
- **research**: locate authoritative sources, summarize with citations, flag uncertainty.
- **deep_reading**: extract meaning/relevance from given material for the task; not raw dump.
- **analysis**: synthesize inputs into conclusions/insights with reasoning.
- **planning**: produce structured plan proposals (feeds Planner).
- **coding**: generate correct code honoring spec + constraints; include rationale.
- **writing**: produce coherent content matching goal + context.
- **debug**: diagnose root cause of failure with evidence.
- **fix**: apply targeted correction addressing diagnosed defect.
- **review**: evaluate against requirements; list gaps.
- **testing**: design/run tests; report pass/fail with coverage notes.
- **browser**: interact with web via Playwright; return structured observations.
- **file**: safe file read/write/list under permission layer.
- **verification**: independent check of artifact vs requirement (feeds Verifier 12).
- **security**: audit permissions, secrets exposure, command safety (feeds Security 17).

## 8.7 Quality enforcement (Phase 1 §8)
- `rationale` mandatory in `SubAgentResult`.
- Output validated against `output_schema`.
- `verification_aware` roles self-check before returning success.
- Orchestrator may require external `Verifier` pass at verification points regardless.

## 8.8 Anti-patterns (locked)
- Sub-agent must NOT autonomously spawn other sub-agents (Phase 1 §14). Only Orchestrator/Manager delegate.
- Sub-agent must NOT call provider SDKs directly (via Gateway).
- Sub-agent must NOT bypass Tool Manager permissions.
- No role outside the 14 (Phase 1 §20).

## 8.9 Phase-4 modules
- `app/runtime/managers/sub_agent_manager.py` (registry + delegation + monitoring).
- `app/runtime/sub_agents/` (one module per role implementing `SubAgentContract`).
- Tests: each role returns valid `SubAgentResult` with `rationale`; fallback works; permission-limited tools rejected.
```
