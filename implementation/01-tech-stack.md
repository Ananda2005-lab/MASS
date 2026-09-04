# 01 — Technology Stack

Derived strictly from locked Phase 1 stack (§18) and Phase 2.1 decisions. No new technologies introduced without reason.

## Primary languages
- **Backend:** Python 3.11+ (async). Reason: FastAPI/asyncio locked (Phase 1 §18).
- **Frontend:** TypeScript (strict). Reason: Next.js/React locked (Phase 1 §18).

## Backend framework
- **FastAPI** + **asyncio** + **Uvicorn** (ASGI). Reason: locked; async required for concurrent sub-agent/tool/LLM calls and realtime.

## Frontend / UI
- **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Zustand** (client state), **Framer Motion** (motion). Reason: locked (Phase 1 §18).

## Database / storage
- **PostgreSQL** (durable relational). Reason: locked.
- **Redis** (cache, queues, live task state, rate limiting, realtime pub/sub). Reason: locked.
- **pgvector** (optional semantic memory only when needed). Reason: locked, optional (08/decision 05).

## Realtime transport
- **WebSocket** (primary, bidirectional) via FastAPI `websockets`/ASGI; **SSE** (secondary, read-only) via `StreamingResponse`. Reason: decision 01 (Hybrid).

## LLM integration layer
- Custom **LLM Gateway + Router** (no external agent framework, no direct provider SDK in runtime). Reason: locked (Phase 1 §18, §20.15). Provider SDKs live only inside Gateway adapter modules.

## Configuration system
- Environment variables + a versioned `config/` (YAML/JSON) for provider profiles, permissions, weights. Secrets via env/secret store only. Reason: operator-scoped config (13, 15).

## Logging / observability
- Structured JSON logs (`structlog` or stdlib `logging` JSON formatter) + trace spans. Reason: decision/observability (16). No secrets in logs.

## Testing frameworks
- **Backend:** `pytest` + `pytest-asyncio` (unit/integration/router/contract). Reason: locked (13/17).
- **Frontend:** `vitest` (unit) + `@playwright/test` (E2E/UI). Reason: Next.js ecosystem, matches Playwright browser tech (locked).

## Build / package system
- **Backend:** `pyproject.toml` (uv or pip). **Frontend:** `npm`/`pnpm` + Next.js build. Reason: standard for locked stack.

## Dependency classes
| Class | Examples | Reason |
|-------|----------|--------|
| Required runtime | fastapi, uvicorn, sqlalchemy, asyncpg, redis/redis-py, pydantic, httpx, websockets | core runtime + persistence + realtime |
| Optional | pgvector (psycopg + vector ext), MCP client lib | only when feature used |
| Dev-only | pytest, pytest-asyncio, ruff, mypy, vitest, playwright, typescript | testing/lint |
| Provider SDKs | provider SDKs live ONLY inside Gateway adapters (not imported by runtime core) | keeps core provider-agnostic |

No technology is added for popularity; every dependency above maps to a locked requirement. No stack replacement.
