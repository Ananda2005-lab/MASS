# 16 — Data Persistence

Implements Phase 1 §18 (PostgreSQL, Redis, pgvector optional). Durable task state, events, results, memory, config. Live state/queues in Redis. Separation: `app/persistence` is the only DB-touching layer (03).

## 16.1 Stores
| Store | Technology | Holds | Reason |
|-------|-----------|-------|--------|
| Relational | PostgreSQL | Task, Plan, Step, Result, Artifact, Error, Conversation, User, Event log, Memory | durable relational (locked) |
| Cache/live | Redis | live Task State, event stream, rate-limit counters, realtime pub/sub, queues | fast live + realtime (locked) |
| Vector (optional) | pgvector | embeddings for semantic memory (only if added later) | optional semantic (locked, 10.8) |

## 16.2 Entity map → contracts (04)
| Entity | Source contract |
|--------|-----------------|
| conversations | Conversation (implied by Task.conversation_id) |
| tasks | Task (§4.1) |
| plans | Plan (§4.5) |
| steps | Step (§4.6) |
| results | Result (§4.9) |
| artifacts | Artifact (§4.10) |
| errors | ErrorInfo (§4.11) |
| events | Event (§4.24) |
| memory_items | important memory (10.1) |
| llm_calls | LLMResponse (§4.22) + Usage |
| tool_calls | ToolResult (§4.16) |

## 16.3 Write paths
- Runtime mutation → `app/state` → `app/persistence.repos` (PostgreSQL durable) AND Redis (live).
- Event log: every state mutation appends `Event` to PostgreSQL + Redis stream.
- Rate limiting / quotas: Redis counters (also Gateway quota 09.6).

## 16.4 Read paths
- UI restore: API → repos (PostgreSQL) or live (Redis) → contract-shaped response.
- Reconstruction (10.7): load Task + results + memory from PostgreSQL.
- Replay: event_bus reads PostgreSQL event log + Redis stream.

## 16.5 Repository pattern
Module: `app/persistence/repos.py` exposes typed repos (`TaskRepo`, `EventRepo`, `ResultRepo`, `MemoryRepo`, ...). Runtime/state call repos; repos own SQL/Redis calls. No raw SQL in runtime.

## 16.6 Migrations & versioning
- Schema versioned (Alembic or equivalent). `Plan.version`, `Step.retry_count`, event `seq` are application-level versions (04); DB migrations are separate infra versions.
- Backward-compatible migration policy; contract changes go through spec update (no silent schema drift).

## 16.7 pgvector (optional, future)
- If semantic memory added, introduce `memory_embeddings` table with vector column; Memory Manager queries by similarity as another `ContextLayer` source. No core rewrite (10.8). Not built in initial phase.

## 16.8 Anti-patterns (locked)
- No DB access outside `app/persistence` (03).
- No provider secrets in DB (Security 17; secrets in secret store).
- No event loss: every mutation persists event.
- Redis must not be sole source of truth for durable data (PostgreSQL is).

## 16.9 Phase-4 modules
- `app/persistence/models.py` (SQLAlchemy entities), `app/persistence/repos.py`.
- Connection management in `app/main.py` lifespan; pool config in `config/`.
- Tests (22): round-trip persist/load per entity, event append+replay, Redis live sync, migration applies cleanly.
