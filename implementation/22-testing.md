# 22 — Testing Strategy

Implements Phase 1 §18 (Testing) and §17 (test types). Supports unit, integration, agent, tool, LLM router, API, UI, end-to-end tests. No application code in Phase 3 (this doc only specifies what Phase 4 must test).

## 22.1 Frameworks (locked, §18)
- Backend: `pytest` + `pytest-asyncio` (NOT an LSP tool — runs via testing-agent `pytest` command).
- Frontend: `vitest` (unit) + `@playwright/test` (E2E/UI). Matches Next.js + Playwright browser tech.

## 22.2 Test levels (Phase 1 §17)
| Level | Target | Tool | Notes |
|-------|--------|------|-------|
| Unit | contracts, router scoring, compression, parsers | pytest / vitest | pure logic, no external |
| Integration | runtime↔state↔persistence, gateway↔adapter | pytest + test DB/Redis | ephemeral fixtures |
| Agent | sub-agent contract adherence, rationale present | pytest | mock LLM/Tool via fakes |
| Tool | permission gating, MCP normalize, error policy | pytest | mock MCP server |
| LLM Router | filter/score/fallback/cooldown/quota(no bypass) | pytest | fake providers + quota |
| API | endpoint contracts, auth, delegation | pytest + httpx/TestClient | no orchestration logic leak |
| UI | mode flows, event rendering, approve | Playwright | Instruction ≠ Workspace |
| E2E | full task via API+realtime | pytest+Playwright | sample task end-to-end |

## 22.3 Mocking strategy
- LLM Gateway: fake provider adapters returning canned `LLMResponse` (no real keys in tests).
- Tools: fakes for native + mock MCP server.
- Persistence: ephemeral PostgreSQL + Redis (test containers / temp).
- Secrets: test secret store with dummy values; redaction tests assert no leak.

## 22.4 What must be verified (spec-derived)
- Contracts validate (04); frontend types mirror backend.
- Router never bypasses quota/rate-limit (09.7).
- Verification not skipped at `verification_points` (12).
- Sub-agents return `rationale` + valid result (08).
- Permission layer blocks unapproved destructive tools (17.2).
- Task state persists + reconstructs (13/10.7).
- Two modes distinct + share core (19/20/21).

## 22.5 CI / gating
- Lint + typecheck (ruff/mypy backend; tsc/eslint frontend) must pass.
- `pytest` (backend) + `vitest` + `playwright` (frontend) on every change.
- Coverage threshold configurable; contract tests block drift.
- No real provider keys in CI (use fakes); integration uses ephemeral stores.

## 22.6 Anti-patterns (locked)
- No real provider credentials in tests (use fakes; 09.7 spirit).
- No business logic duplicated in tests (test behavior, not internals).
- No skipping verification/security tests for speed.
- pytest is a command run by testing-agent, NOT an LSP tool (user clarification).

## 22.7 Phase-4 execution
- Create `backend/tests/` mirroring `app/`; `frontend/tests/` for lib/store/UI.
- Each module doc (05–21) lists its test obligations; satisfy them in Phase 4.
- Report: unit/integration/agent/tool/router/API/UI/E2E results + coverage.
