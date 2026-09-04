# 13 — Testing Strategy

Source: Master Project Specification §15, §16, §18.

## Required test layers (§18)
- unit tests
- integration tests
- agent tests
- tool tests
- LLM router tests
- API tests
- UI tests
- end-to-end tests

## Verification loop (§15, locked)
```
Generate → Verify → Correct?
  if correct → Final
  if incorrect → Diagnose → Retry / Fix / Re-plan → Verify again
```

## Error recovery (§16)
Failures to design for: LLM errors, rate limits, provider/model failures, tool failures, invalid tool results, incorrect output, code failures, sub-agent failures, planning failures.
Recovery mechanisms: retry, fallback, diagnose, fix, re-plan, verify.

## Notes
- The `testing-agent` subagent owns test authoring/execution (pytest for Python backend; project runner for frontend).
- Concrete test harnesses are implementation tasks; this phase only records the required layers and the verify/recover loop.
