# AI Agent Platform — Planning & Specification Foundation

This folder documents the **planning/specification foundation** for the AI Agent Platform, created per the *Master Project Specification* (§21–§24). Per §21 and §23, the application is **NOT implemented here** — only the locked architecture and design boundaries are recorded so later implementation tasks have a stable reference.

## Status
- Phase: planning / specification only.
- Not implemented: Agent Runtime, Orchestrator, LLM router, sub-agents (beyond planning), tools (beyond interfaces), UI, data layer.
- Existing project contents inspected (§22): `Master Project Specification — AI Agent Platform.md`, and `.opencode/` (opencode config: MCP servers `context7`, `code-intelligence`, `graphify`; 13 subagents; 1 plugin).

## Document map
1. Product Requirements — `01-product-requirements.md`
2. Architecture — `02-architecture.md`
3. Agent Runtime — `03-agent-runtime.md`
4. Orchestration — `04-orchestration.md`
5. Sub-Agent Architecture — `05-sub-agent-architecture.md`
6. Tool Architecture — `06-tool-architecture.md`
7. LLM Gateway — `07-llm-gateway.md`
8. Memory / Context — `08-memory-context.md`
9. Task State — `09-task-state.md`
10. UI Modes — `10-ui-modes.md`
11. Security — `11-security.md`
12. Data Architecture — `12-data-architecture.md`
13. Testing Strategy — `13-testing-strategy.md`
14. Future Extensions — `14-future-extensions.md`

## Locked decisions (do not change without explicit approval)
- **Two user modes:** Instruction and Workspace — separate UX, same AI core.
- **Agent Runtime roles:** Main Agent, Planner, Orchestrator, Executor, Verifier, Sub-Agent Manager, Tool Manager, Memory Manager.
- **Orchestrator** is the central execution controller; sub-agents are NOT uncontrolled independent agents.
- **Tech stack (locked):** Frontend = Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Framer Motion. Backend = Python, FastAPI, asyncio. Data = PostgreSQL, Redis, pgvector. Browser = Playwright. Real-time = WebSocket/SSE.
- **LLM Gateway** abstraction — agents must NOT directly depend on individual providers.
- **Mobile / device control** is explicitly future scope (§12), not this phase.
- **Security from the beginning** (§19): no provider keys in frontend, permission controls, sandboxing, approvals, rate limiting, audit logs.

## Development rules enforced (§20)
No guessing missing requirements, no redesign, no stack replacement, no unspecified features, no duplicate systems, no bypass of abstraction layers, no secret exposure, no silent changes to locked decisions, no premature mobile control, no Workspace-as-IDE, no chatbot-treatment of Instruction mode, no uncontrolled sub-agents, no external agent framework as core.

## Open decisions requiring explicit approval
None blocking. The following are **explicitly deferred by the spec** (not ambiguities): detailed LLM routing algorithm (§10), concrete verification strategies (§15), recovery behavior specifics (§16), and per-sub-agent implementation (§7). These will be specified in later tasks.
