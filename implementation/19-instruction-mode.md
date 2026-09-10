# 19 — Instruction Mode (Mode A)

Implements Phase 1 §3 (MODE A — INSTRUCTION). Separate purpose-built experience from Workspace (Phase 1 §4, §20.12). Autonomous agent experience: user gives natural-language instruction; Main Agent + Orchestrator determine plan/sub-agents/tools/models/order/verification/recovery unless user constrains (Phase 1 §3, §9). Not a simple chatbot (Phase 1 §20.13).

## 19.1 Purpose
- User types an instruction ("Research this", "Build this", "Fix this").
- System autonomously: understand → context/memory → classify → plan → orchestrate → execute → verify → fix/retry → final.
- User may supply constraints (model/agent/tool/order/scope) — guidance only, security still enforced (Phase 1 §9).

## 19.2 Interaction flow (UI)
1. Input box for natural-language instruction (+ optional constraint chips).
2. On submit → `POST /instruction` (15) → `Task` created; realtime events stream progress.
3. UI shows: current plan (collapsed), active step, live sub-agent/tool activity, verification status, final result.
4. User can interrupt/approve via realtime commands (14) when permission requested or `task_paused`.
5. Result presented with artifacts; user may iterate (new instruction referencing task).

## 19.3 What NOT to do (locked)
- Not a plain chatbot: must show orchestration, steps, sub-agents, verification — the autonomous pipeline (Phase 1 §20.13).
- Not a coding IDE (that's Workspace's trap to avoid; Instruction is task-driven, any domain).
- UI differs from Workspace (separate route group, separate components — 21, 23).

## 19.4 Backend entry
- `app/api/instruction.py` `POST /instruction` → Main Agent → Planner → Orchestrator. Returns `task_id`; progress via realtime (14).

## 19.5 Phase-4 scope
- Frontend: `app/(instruction)/` route group + components (instruction input, plan view, activity stream, result view).
- Store: Zustand `instructionStore` consuming events.
- Backend: `instruction.py` router + reuse runtime (no new runtime logic).

## 19.6 UI components (purpose-built, not IDE)
| Component | Role |
|-----------|------|
| InstructionInput | NL input + constraint chips |
| PlanOutline | collapsed/expandable plan (steps, deps, verification points) |
| ActivityStream | live events (step start/complete, tool call, llm call, sub-agent result) |
| VerificationBadge | per-step verify status |
| ResultPanel | final result + artifacts (text/file/link) |
| ControlBar | interrupt / approve / resume |

## 19.7 Constraints handling (Phase 1 §9)
- Constraint chips map to `Constraint` (§4.12): model/sub_agent/tool/order/scope/permission.
- Invalid constraint (bypass security) → `task_paused` with explanation, not silent ignore.
- User constraints surfaced in PlanOutline so user sees them applied.

## 19.8 Phase-4 detail
- Reuse shared UI primitives (shadcn/ui) but distinct layout from Workspace (21).
- Real-time via `lib/realtime.ts` (WS primary). State in `store/instructionStore.ts`.
- Tests (22/UI): submit instruction → task created; events render; approve flow works; not-chatbot (shows plan/activity).
