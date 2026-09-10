# 24 — Implementation Order & Milestones

Safe, dependency-respecting order for Phase 4 tasks (23). Prevents rework; respects layer boundaries (03). Each step gated by tests (22).

## 24.1 Dependency-driven order
```
1. T1 Scaffold backend        (no deps)
2. T2 Scaffold frontend       (no deps)
3. T3 Core contracts           (needs T1) → enables everything
4. T4 Persistence              (needs T3)
5. T5 Task state + events      (needs T3,T4)
6. T6 LLM Gateway             (needs T3; adapters isolated)
7. T7 Tool Manager + native    (needs T3,T5,17 later)
8. T8 MCP adapter             (needs T7)
9. T9 Memory Manager          (needs T3,T4,T5,T6)
10. T10 Sub-Agent Manager+roles(needs T3,T5,T6,T7)
11. T11 Main Agent + Planner   (needs T10,T5)
12. T12 Orchestrator          (needs T11,T10,T9,T6)
13. T13 Executor + Verifier    (needs T12,T5,12)
14. T14 Backend API           (needs T13,T5,17)
15. T15 Realtime              (needs T5,17)
16. T16 Security              (needed by T7,T14,T15; ideally early)
17. T17 Observability         (cross-cutting; wire early)
18. T18 Instruction UI        (needs T14,T15,21)
19. T19 Workspace UI          (needs T14,T15,21)
20. T20 Realtime client+stores(needs T15,21; before T18/T19 UI logic)
21. T21 Backend tests
22. T22 Frontend tests
23. T23 E2E
24. T24 Operator docs
25. T25 Final audit
```
Note: T16/T17 should be introduced as early as practical (security/observability are cross-cutting, 03) — insert after T3.

## 24.2 Recommended milestones
- **M1 Foundation:** T1–T5 + T16/T17 basics → system boots, task/event persistence works.
- **M2 Core intelligence:** T6–T13 → an end-to-end task runs via runtime (no UI yet), verification+recovery works.
- **M3 Surface:** T14–T15, T20 → API + realtime usable by clients.
- **M4 Experience:** T18–T19 → both modes functional, distinct UIs.
- **M5 Assurance:** T21–T25 → tests green, docs, final audit.

## 24.3 Gating rules
- No task starts before its dependencies pass tests.
- T12 (Orchestrator) blocked until T10/T11 (sub-agents/planner) exist.
- T14/T15 blocked until T13 (runtime complete) + T16 (security).
- UI tasks blocked until T20 (realtime client) ready.

## 24.4 Milestone exit criteria
| Milestone | Exit condition |
|-----------|----------------|
| M1 | App boots; Task + events persist/load; security/observability wired; contract tests pass |
| M2 | Sample task runs end-to-end via runtime; verification points enforced; recovery exercised; router fallback works |
| M3 | API + realtime serve task lifecycle; auth + permission flow works |
| M4 | Instruction + Workspace UIs distinct, event-driven, approve/interrupt functional |
| M5 | All test levels green; operator docs complete; final audit clean |

## 24.5 Anti-patterns (locked)
- No skipping dependency order (causes rework / layer violations).
- No implementing UI before core runtime (would guess contracts).
- No milestone accepted without its tests (22).
- No architectural deviation during Phase 4 (any needed change → spec update first, Phase 1 §20.1).

## 24.6 Phase-4 rule reinforcement
If during Phase 4 a genuine ambiguity appears, STOP and report (Phase 1 §20.1, §24) — do not guess. This blueprint is the contract; deviations go back to spec.
