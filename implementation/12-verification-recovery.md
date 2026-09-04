# 12 — Verification & Recovery

Implements Phase 1 §15, §16 and Phase 2.1 decision 03. Generate → Verify → Correct? loop. Verification = per-category methods (decision 03). Recovery = retry/fallback/diagnose/fix/replan/verify (Phase 1 §16). No arbitrary recovery behavior not specified (Phase 1 §16).

## 12.1 Principle (locked)
Agent must not blindly accept generated results (Phase 1 §15).
```
Generate → Verify → Correct?
  if correct → Final
  if incorrect → Diagnose → Retry/Fix/Replan → Verify again
```

## 12.2 Verifier component
Module: `app/verification/verifier.py` + `app/verification/methods.py`.
- `verify(target, requirement) -> VerificationResult { passed: bool, method: str, findings: list, confidence: float }`.
- Runs at every `Plan.verification_point` (step level) and finally (task level).
- Method selected by category (§12.3). Independent of generator (most verification done by `verification` sub-agent or tool-based check, not the producing agent judging itself where possible).

## 12.3 Per-category verification methods (decision 03)
| Category | Method | Mechanism |
|----------|--------|-----------|
| code | static + execution | lint/type check; run in sandbox; unit tests if present |
| text/write | requirement check | LLM rubric vs goal; factual consistency |
| research | source check | citation presence; source credibility; contradiction scan |
| analysis | logic check | assumption validity; data consistency |
| file | existence/integrity | file written, parseable, path within scope |
| browser | observation check | expected DOM/state present; screenshot diff |
| test | pass/fail | test suite result; coverage threshold |
| security | audit | secret scan; permission check; command safety |
| mixed | composite | run each sub-part method, aggregate |

## 12.4 Verification inputs
- `requirement`: from `Step.goal` + user constraints + task goal.
- `target`: `Result`/`Artifact` produced.
- `context`: relevant `ContextBundle` (for consistency).
Verifier records `VerificationResult` in Task State + emits `verification_result`.

## 12.5 Recovery strategies (Phase 1 §16, mapped to 06.4)
On `VerificationResult.passed=false`:
1. **Diagnose:** produce `ErrorInfo`/`findings` (root cause).
2. **Retry:** same approach with corrected context (bounded).
3. **Fix:** dispatch `fix`/`debug` sub-agent with defective artifact + diagnosis.
4. **Fallback:** alternative sub-agent/tool/model (Gateway fallback 09).
5. **Replan:** restructure steps (Planner) with failure context.
6. **Verify again** after each correction.
7. **Exhausted:** `task_failed` with audit trail.
Recovery is bounded by configurable budget; no infinite loops (Phase 1 §16).

## 12.6 Failure taxonomy (Phase 1 §16) → handling owner
| Failure | Detected by | Recovery owner |
|---------|-------------|----------------|
| LLM errors | Gateway | retry/fallback (09) → else Orchestrator |
| Rate limits | Gateway | cooldown + route (09) |
| Provider/model failures | Gateway | fallback chain (09) |
| Model failures (bad output) | Verifier | fix/replan (12.5) |
| Tool failures | Tool Manager | retry/fallback policy (11) |
| Invalid tool results | Verifier | retry tool / alternative |
| Incorrect output | Verifier | diagnose→fix (12.5) |
| Code failures | Verifier (exec) | debug/fix (08) |
| Sub-agent failures | Sub-Agent Manager | fallback_role / Orchestrator |
| Planning failures | Orchestrator | replan (06.4) |

## 12.7 Anti-patterns (locked)
- No blind acceptance of generated output (Phase 1 §15).
- No recovery behavior invented beyond retry/fallback/diagnose/fix/replan/verify (Phase 1 §16).
- Verification must not be skipped at `verification_points`.
- Verifier must not mutate business state beyond recording result.

## 12.8 Phase-4 modules
- `app/verification/verifier.py`, `app/verification/methods.py`.
- Integration points: Orchestrator calls Verifier at verification points (06); Executor/Manager feed targets.
- Tests (22): each category method on pass/fail samples; recovery loop bounds; no-skip at verification points; diagnose→fix→verify sequence.
