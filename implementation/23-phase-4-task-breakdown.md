# 23 — Phase 4 Task Breakdown

Concrete, implementation-ready tasks for Phase 4, derived strictly from this blueprint + Phase 1/2/2.1. Phase 3 wrote NO code (§3, §30); these are the tasks Phase 4 executes. Order guidance in 24.

## 23.1 Foundation
- **T1 Scaffold backend**: `pyproject.toml`, FastAPI app factory (`main.py`), config loading, lifespan wiring (state/event_bus/gateway). No logic yet.
- **T2 Scaffold frontend**: Next.js App Router, Tailwind/shadcn/Zustand/Framer Motion, `(instruction)` + `(workspace)` route groups, `lib/types.ts` mirroring §04.
- **T3 Core contracts**: implement `app/core/*.py` (Task, Plan, Step, Tool, SubAgentContract, LLM, Event, Context) as pydantic; mirror in `frontend/lib/types.ts`.

## 23.2 Persistence & state
- **T4 Persistence models + repos** (16): SQLAlchemy entities + repos; PostgreSQL + Redis clients.
- **T5 Task state + event bus** (13): state store + machine + event_bus (publish/subscribe/replay).

## 23.3 Gateway
- **T6 LLM Gateway** (09): provider/model/credential entities, router (weighted scoring), fallback, retry, cooldown, health/quota, adapters (fake+at least one real behind config). No bypass (09.7).

## 23.4 Tools & MCP
- **T7 Tool Manager + registry** (11): registry, permission gate, native tools (initial set), error policies.
- **T8 MCP adapter** (11.5): discover + normalize MCP tools → `Tool`.

## 23.5 Memory
- **T9 Memory Manager** (10): assembler + compressor + store; threshold compression; reconstruction (10.7).

## 23.6 Runtime
- **T10 Sub-Agent Manager + 14 roles** (08): registry, delegation, monitoring, fallback; implement each role's `run` with `rationale`.
- **T11 Main Agent + Planner** (05.2/05.3/07): intent normalize, classify, decompose → Plan DAG.
- **T12 Orchestrator** (06): execution loop, selection, parallel/seq, retry/fix/replan, constraint handling.
- **T13 Executor + Verifier** (05.4/05.5/12): step exec, verification methods per category, recovery integration.

## 23.7 API & realtime
- **T14 Backend API** (15): 7 routers; contract validation; delegate to runtime; audit.
- **T15 Realtime** (14): WS primary + SSE secondary; subscribe scopes; replay; command routing.

## 23.8 Security & observability
- **T16 Security** (17): auth, permissions, secrets, audit, sandbox hooks, rate limits.
- **T17 Observability** (18): structured logs, tracing, metrics, redaction.

## 23.9 Modes & UI
- **T18 Instruction Mode UI** (19/21): input, plan view, activity stream, result, controls; store.
- **T19 Workspace Mode UI** (20/21): adaptive panels, action routing, store.
- **T20 Shared realtime client + stores** (21.5/21.6).

## 23.10 Testing
- **T21 Backend tests** (22): unit/integration/agent/tool/router/API per §22.2.
- **T22 Frontend tests** (22): vitest (lib/store) + Playwright (mode flows, distinct UIs).
- **T23 E2E** (22): full sample task via API+realtime; verification + recovery exercised.

## 23.11 Documentation
- **T24 Operator docs**: `config/` schemas (providers, perms, weights, realtime toggles) + runbook.
- **T25 Final consistency audit**: re-run `consistency-audit.md` checks against implemented code; confirm no locked-decision violation.

## 23.12 Acceptance criteria (per task)
Each task accepted only when:
- Implements the referenced blueprint section exactly (no architecture change).
- Passes its specified tests (22).
- Does not bypass abstraction layers (03) or locked decisions.
- No provider keys in frontend/logs (17.3).
- Two modes distinct, share core (19/20/21).

## 23.13 Anti-patterns (locked)
- No new tasks adding unspecified features (Phase 1 §20.5).
- No task replacing tech stack (Phase 1 §20.3).
- No mobile/device implementation (Phase 1 §20.11) — future only.
- No final visual design in Phase 4 unless separately instructed (Phase 1 §4).

## 23.14 Out of scope for Phase 4
- Full semantic/vector memory (optional, 10.8).
- Mobile/device control (11.7).
- Additional sub-agent roles beyond 14 (08.3).
- Final premium visual design (21.8).
