# Implementation Blueprint — Phase 3

This directory converts the locked Phase 1 (planning), Phase 2 (architecture), and Phase 2.1 (decisions) into an exact, implementation-ready blueprint for Phase 4. **No application code is written here** (Phase 3 §3, §30). Every module, contract, state machine, event, and Phase-4 task is specified so a coding agent implements without making architectural decisions.

## Source of truth
- `planning/` (Phase 1) — locked product/architecture decisions.
- `architecture/` (Phase 2) — 18 detailed specs.
- `architecture/decisions/` (Phase 2.1) — 5 resolved open decisions.
- Master Project Specification.

## Document map
| # | Doc | Maps to |
|---|-----|---------|
| 01 | tech-stack.md | §4 |
| 02 | project-structure.md | §5 |
| 03 | module-boundaries.md | §6 |
| 04 | core-contracts.md | shared contracts |
| 05 | agent-runtime.md | 02-agent-runtime |
| 06 | orchestrator.md | 03-orchestrator |
| 07 | task-system.md | 04 / 09 |
| 08 | sub-agent-implementation.md | 05 / decision 04 |
| 09 | llm-gateway.md | 07 / decision 02 |
| 10 | memory-context.md | 08 / decision 05 |
| 11 | tool-mcp.md | 06 |
| 12 | verification-recovery.md | 10 / decision 03 |
| 13 | task-state-events.md | 09 |
| 14 | realtime.md | 13 / decision 01 |
| 15 | backend-api.md | 13 (API) |
| 16 | data-persistence.md | 14 |
| 17 | security.md | 15 |
| 18 | observability.md | 16 |
| 19 | instruction-mode.md | 11 |
| 20 | workspace-mode.md | 12 |
| 21 | ui-blueprint.md | 23 |
| 22 | testing.md | 17 |
| 23 | phase-4-task-breakdown.md | 26 |
| 24 | implementation-order.md | 25 |
| 25 | phase-4-rules.md | 27 |
| consistency-audit.md | §29 | |

## Consistency
See `consistency-audit.md`. No contradiction with Phase 1/2/2.1. No implementation performed. Phase 4 NOT started.
