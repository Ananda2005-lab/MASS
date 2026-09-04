# AI Agent Platform — Phase 2 Architecture Specification

This directory contains the **detailed, implementation-ready architecture specification** produced in Phase 2. It converts the Phase-1 planning foundation (`../planning/`) into precise architecture that a Phase-3 engineer can implement without inventing the design.

## Relationship to Phase 1
- Phase 1 (`../planning/`) is the **source of truth** for all locked decisions.
- This phase does **NOT** redesign, replace the stack, or add unspecified features.
- No application code, endpoints, models, agent classes, router logic, tools, or UI are implemented here (see §26 of the Phase-2 brief).

## Document map
| # | Document | Scope |
|---|----------|-------|
| 01 | system-architecture.md | End-to-end component map and boundaries |
| 02 | agent-runtime.md | Agent Runtime internal components + lifecycle state machine |
| 03 | orchestrator.md | Orchestration lifecycle, decomposition, selection, control flow |
| 04 | task-planning-and-execution.md | Task/Plan/Step model and concurrent execution |
| 05 | sub-agent-system.md | 14 specialized sub-agent specs + dev vs runtime distinction |
| 06 | tool-and-mcp-system.md | Tool Registry/Interface + MCP boundary |
| 07 | llm-gateway-and-router.md | Provider/Model/Credential abstraction + routing concepts |
| 08 | memory-and-context.md | Context layers, assembly, compression, retrieval |
| 09 | task-state-and-events.md | Persistent task state + event vocabulary |
| 10 | verification-and-recovery.md | Verify/Diagnose/Fix/Retry/Replan loop + limits |
| 11 | instruction-mode.md | Instruction Mode UX + system interaction model |
| 12 | workspace-mode.md | Workspace Mode UX (not an IDE) |
| 13 | backend-api-and-realtime.md | FastAPI boundaries + WebSocket/SSE usage |
| 14 | data-and-persistence.md | PostgreSQL/Redis/pgvector entities + relationships |
| 15 | security-and-permissions.md | Auth, permissions, approvals, secrets, sandboxing |
| 16 | observability-and-logging.md | Logs, traces, usage/tool/error records |
| 17 | testing-architecture.md | Test layers + what to mock vs integrate |
| 18 | phase-3-implementation-boundary.md | Exact boundary of what Phase 3 must produce |

## Major component tiers (locked from Phase 1)
```
FRONTEND          Next.js / React / TS / Tailwind / shadcn / Zustand / Framer Motion
BACKEND           Python / FastAPI / asyncio
AGENT CORE        Custom Agent Runtime + Orchestrator + LLM Gateway (no external agent framework)
INFRASTRUCTURE    PostgreSQL, Redis, pgvector (optional), Playwright
EXTERNAL          LLM Providers, MCP servers, web/search/browser services
```

## OPEN ARCHITECTURE DECISIONS
All five previously-open decisions are **RESOLVED in Phase 2.1** (see `decisions/README.md` and `decisions/consistency-audit.md`). They are no longer open:

1. Realtime transport → **Hybrid (WebSocket primary + SSE secondary)** — `decisions/01-realtime-decision.md`
2. LLM routing algorithm → **Weighted candidate scoring** — `decisions/02-llm-router-decision.md`
3. Verification strategies → **Per-category verification methods** — `decisions/03-verification-decision.md`
4. Sub-agent runtime contracts → **Common SubAgentContract** — `decisions/04-sub-agent-contract-decision.md`
5. Context compression/summarization policy → **Threshold-triggered + Task-State reconstruction** — `decisions/05-context-management-decision.md`

All other items in this specification are derived from locked Phase-1 decisions and are NOT open.
