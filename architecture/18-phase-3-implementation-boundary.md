# 18 — Phase 3 Implementation Boundary

Precise boundary between Phase 2 (this phase) and Phase 3. No implementation blueprint produced here (Phase 2 §26).

## What Phase 3 MUST produce
Phase 3 converts this architecture into:
- **exact project folder structure** for frontend (Next.js app) and backend (FastAPI package).
- **exact modules** mapping to components in 01–03 (Main Agent, Planner, Orchestrator, Executor, Verifier, Managers, Gateway, Router).
- **exact classes/interfaces** for Task, Plan, Step, Tool, ToolRegistry, SubAgent, LLMGateway, Router, MemoryManager, Event types.
- **exact schemas** (JSON Schema / Pydantic / TS types) for requests, outputs, task state, events.
- **exact API contracts** for the groups in 13-backend-api-and-realtime.md.
- **exact state machines** from 02 (agent lifecycle) and 03 (orchestration).
- **exact event contracts** from 09-task-state-and-events.md.
- **exact dependency relationships** from 14-data-and-persistence.md (entities + migrations).
- **exact implementation sequence** (build order: core runtime -> gateway -> tools -> sub-agents -> API -> realtime -> UI).
- **exact test boundaries** from 17-testing-architecture.md.

## What Phase 3 MUST NOT do without new approval
- Change locked Phase-1 decisions (stack, two modes, agent roles, no external framework).
- Implement mobile/device control (future scope, Phase 1 §12).
- Treat OpenCode dev sub-agents as product runtime sub-agents (05).
- Bypass provider terms / quota limits (07).

## Resolved vs open
- Resolved by Phase 2: component responsibilities, communication boundaries, lifecycle/state machines, event vocabulary, verification/recovery mechanism, security boundaries, data entities, testing layers.
- Still OPEN (needs approval before Phase 3 codes them): realtime transport (13), concrete LLM routing scoring (07), concrete verification strategies (10), per-sub-agent runtime contracts (05), context compression policy (08). Phase 3 should request decisions on these before implementing the affected parts.

## Gate
Phase 3 starts only after this Phase-2 set is reviewed and the OPEN decisions are resolved or explicitly deferred with owners.
