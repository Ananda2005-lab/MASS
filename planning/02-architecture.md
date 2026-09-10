# 02 — Architecture

Source: Master Project Specification §4, §5, §13, §18.

## Conceptual layering (locked)
```
USER
→ Instruction OR Workspace          (UX layer, two distinct experiences)
→ API / Session Layer
→ Agent Runtime
→ Orchestrator
→ Sub-Agents / Tools
→ LLM Gateway
→ Models
→ Memory / State
→ Infrastructure
```

## Agent Runtime components (locked, §5)
- Main Agent (general-purpose)
- Planner
- Orchestrator (central execution controller)
- Executor
- Verifier
- Sub-Agent Manager
- Tool Manager
- Memory Manager

## Design principles
- **Modular platform:** new capabilities must be addable without rewriting core architecture.
- **Abstraction boundaries:** Agents → LLM Gateway (not providers directly); Tools via Tool Manager; Sub-Agents via Sub-Agent Manager; state via Memory Manager.
- **No external agent framework as the core** (§20.15). Custom Agent Runtime / Orchestrator / LLM Gateway.

## Technology stack (locked, §18)
| Layer | Choice |
|-------|--------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Framer Motion |
| Backend | Python, FastAPI, asyncio |
| AI Core | Custom Agent Runtime, Orchestrator, LLM Gateway/Router |
| Data | PostgreSQL, Redis, pgvector (when semantic/vector memory needed) |
| Browser | Playwright |
| Real-time | WebSocket and/or SSE |
| Security | permission layer, API-key protection, sandboxing, command restrictions, user approval, rate limiting, audit logs |
| Testing | unit, integration, agent, tool, LLM router, API, UI, end-to-end |

## Deferred
Detailed internal module interfaces and the LLM routing algorithm are specified in later tasks (§10).
