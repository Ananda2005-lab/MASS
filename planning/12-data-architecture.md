# 12 — Data Architecture

Source: Master Project Specification §13, §14, §18.

## Stores (locked, §18)
| Store | Role |
|-------|------|
| PostgreSQL | Primary relational store (task state, results, metadata, tool results, agent state). |
| Redis | Cache, queues, real-time/session state, rate limiting. |
| pgvector | Semantic/vector memory when required (§13, §18). |

## Mapping to architecture
- **Task State (§9)** → PostgreSQL (persistent) + Redis (live session).
- **Memory / Context (§8)** → PostgreSQL + pgvector for retrieval; Redis for hot context.
- **Usage / quota / failure state (§10)** → tracked via LLM Gateway, persisted in PostgreSQL/Redis.

## Constraints
Do not introduce an unspecified datastore. The three above are the locked data layer (§20.3).
