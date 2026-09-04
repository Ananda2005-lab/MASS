# 07 — Task System (Decomposition & Classification)

Implements Phase 1 §3, §7 (initial capability model), §17. Defines how arbitrary user tasks become a structured `Task` → `Plan` DAG. Maps task types to the initial sub-agent capability model (Phase 1 §7). No arbitrary new agents (Phase 1 §20).

## 7.1 Classification
Input: `TaskIntent.raw` + normalized `goal`.
Output: `TaskType` (§4.4) + optional `mixed` flag.

Method (no code):
1. Keyword/structure heuristic → candidate `TaskType`.
2. If ambiguous or multi-intent → `mixed`.
3. Optional LLM-assisted classification via Gateway (capability `chat`) for nuance; result validated against enum (no out-of-set types).
4. `unknown` only when no signal; treated as `mixed` with a clarifying `task_paused` if needed.

## 7.2 Initial sub-agent capability model (Phase 1 §7)
Locked 14 roles: `research, deep_reading, analysis, planning, coding, writing, debug, fix, review, testing, browser, file, verification, security`.
Mapping (type → preferred role):
| TaskType | Primary role | Common tools |
|----------|-------------|--------------|
| research | research | web, search, browser |
| analysis | analysis | files, calculator, browser |
| code | coding | code, terminal, files |
| write | writing | files |
| debug | debug | code, terminal, files |
| fix | fix | code, terminal, files |
| review | review | files, code |
| test | testing | code, terminal |
| browser | browser | browser, web |
| file | file | files |
| verify | verification | files, code, terminal |
| security | security | files, terminal, code |
| mixed | orchestrator-selected per sub-step | mixed |
| unknown | (clarify) | — |

## 7.3 Decomposition rules
- Each Step must have a single clear `goal` (atomic enough to verify).
- Split large goals until each step is independently verifiable (Phase 1 §15).
- Preserve data dependencies as `Dependency` edges (`feeds` = output used as input; `blocks` = ordering only).
- Annotate `verification_points` on steps producing external artifacts.

## 7.4 DAG construction
- Nodes = Steps. Edges = Dependencies.
- Must be acyclic; Planner must validate before `Plan` accepted (cycle → replan).
- Topological layers define parallel batches: steps in same layer with no inter-dependency run in parallel (§6.5).

## 7.5 Example (illustrative only, no code)
Task: "Research X, analyze findings, then write a report."
- Step1 research(X) → tools web/search/browser
- Step2 analysis(findings) depends_on Step1 (feeds)
- Step3 writing(report) depends_on Step2 (feeds)
- Strategy: sequential (chain). Verification points: Step1 (sources), Step3 (report accuracy).
Task: "Research A and Research B, then combine."
- Step1 research(A), Step2 research(B) — parallel (no dep)
- Step3 analysis(combine) depends_on Step1,Step2
- Strategy: parallel then sequential.

## 7.6 Decomposition output contract
Planner returns `Plan` conforming to §4.5:
- `steps`: ≥1, each with `goal`, candidate `tool_ids`, candidate `assigned_agent`, `input_refs`, `depends_on`.
- `edges`: consistent with `depends_on` (no orphans, acyclic).
- `strategy`: derived from DAG.
- `verification_points`: subset of step ids.
- `version`: 1 (or incremented on replan).

## 7.7 Failure handling in decomposition
- Cycle detected → reject Plan, re-run Planner with constraint "no cycles".
- Over-decomposition (hundreds of trivial steps) → Planner heuristic caps step count per task (configurable); otherwise merge.
- Under-decomposition (one giant unverifiable step) → force split until verifiable.

## 7.8 Phase-4 modules
- `app/runtime/planner.py` (decomposition + DAG) — see 05.3.
- Classification helper in `app/runtime/main_agent.py` or `planner.py`.
- Tests: classification accuracy on sample intents; DAG acyclicity; parallel-batch derivation; verification-point marking (see 22).
