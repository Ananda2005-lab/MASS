# 21 — UI Blueprint (Frontend)

Implements Phase 1 §4 (UI principle), §18 (frontend stack), §23 (premium feel later). Next.js/React/TS/Tailwind/shadcn/Zustand/Framer Motion. Two distinct mode experiences sharing the same AI core (Phase 1 §4). No final visual design yet (Phase 1 §4).

## 21.1 Stack (locked)
- Next.js (App Router), React, TypeScript (strict), Tailwind CSS, shadcn/ui, Zustand (client state), Framer Motion (motion).

## 21.2 Architecture
```
frontend/
  app/
    (instruction)/     # Mode A route group
    (workspace)/       # Mode B route group
    layout.tsx, globals.css
  components/          # shared + mode-specific (shadcn-based)
  lib/
    api.ts             # HTTP client → backend (15)
    realtime.ts        # WS primary, SSE fallback (14)
    types.ts           # TS mirror of core contracts (04)
  store/               # Zustand: instructionStore, workspaceStore, sessionStore
  tests/               # vitest (unit) + playwright (e2e)
```
- `lib/types.ts` MUST mirror `app/core` contracts (04) to prevent drift.
- `lib/realtime.ts` consumes `Event` (§4.24); updates Zustand stores.

## 21.3 Two experiences (distinct, locked)
- Instruction: task-driven autonomous pipeline view (19).
- Workspace: adaptive multi-panel environment (20).
- Shared primitives (buttons, cards, dialogs) from shadcn/ui; layout/flow differs per mode.
- Mode entry: top-level route switch; same session/auth.

## 21.4 Core UI capabilities (both modes)
- Submit instruction / action.
- Render live event stream (steps, tools, sub-agents, verification).
- Show plan + task state.
- Approve permission requests (security 17.2).
- View/download artifacts (results 15).
- Interrupt/pause/resume.

## 21.5 Real-time client
- `realtime.ts`: connect WS with auth token + scopes; on drop, fallback to SSE with `last_seq` resume (14.7). Replay restores view.
- Store updates are pure functions of events (no business logic in UI).

## 21.6 State management (Zustand)
- `sessionStore`: auth token, user, active mode.
- `instructionStore`: current task, plan, activity events, result (19).
- `workspaceStore`: panels visibility, panel data, task state (20).
- Stores subscribe to `realtime.ts`; reducers apply `Event` by `seq`.
- No orchestration/LLM logic in frontend.

## 21.7 Anti-patterns (locked)
- No provider keys in frontend (Phase 1 §19) — token only for auth.
- No duplicated agent runtime in UI (core is backend).
- No final visual design yet (Phase 1 §4) — structure/behavior only.
- Instruction and Workspace must be distinct experiences (Phase 1 §4).
- No business logic in stores (event-driven updates only).

## 21.8 Phase-4 modules
- `frontend/app/(instruction)/`, `frontend/app/(workspace)/`, `frontend/components/`, `frontend/lib/{api,realtime,types}.ts`, `frontend/store/*.ts`.
- Tests: vitest for `lib`/store reducers; Playwright for mode flows (22).
- Premium polish deferred per Phase 1 §4; structure built now.
