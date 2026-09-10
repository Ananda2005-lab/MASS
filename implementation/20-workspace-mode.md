# 20 — Workspace Mode (Mode B)

Implements Phase 1 §3 (MODE B — WORKSPACE). NOT a coding IDE. NOT a Codex clone (Phase 1 §20.12). General interactive environment adapting to task type. Same AI core as Instruction (Phase 1 §4). Purpose-built UI distinct from Instruction (Phase 1 §4, §20.12).

## 20.1 Purpose
- General interactive environment for working with the AI agent on varied tasks (research, analysis, files, results, generated artifacts, browser work, execution info, task state, sub-agent activity).
- Workspace adapts panels to the task instead of being programming-only (Phase 1 §3, §20.12).

## 20.2 Adaptive panels (task-dependent visibility)
| Panel | Shows when relevant |
|-------|---------------------|
| Files | file-related tasks |
| Research | sources/notes from research agent |
| Results | generated artifacts/outputs |
| Analysis | synthesized insights/data |
| Tools | tool activity log |
| Agent Activity | sub-agent + orchestrator activity |
| Browser | browser agent sessions/screenshots |
| Execution | terminal/code run info |
| Task State | plan, current step, status |
| Chat/Instruction | ongoing NL interaction |

Panels show/hide based on active task type + events; not all visible at once.

## 20.3 Interaction model
- User can act directly in panels (open file, view result, trigger action) AND converse with agent.
- Actions map to `POST /workspace/action` (15) → runtime.
- Realtime events update relevant panels live (14).
- User-guided orchestration supported (pick sub-agent/model/tool, order) via Workspace controls (Phase 1 §9).

## 20.4 What NOT to do (locked)
- NOT a coding IDE / Codex clone (Phase 1 §20.12).
- NOT a reused Instruction UI (distinct purpose-built experience, Phase 1 §4).
- Must remain general (any task type), not program-only.

## 20.5 Backend entry
- `app/api/workspace.py` `POST /workspace/action`, `GET /workspace/{task_id}` → reuse runtime; no new orchestration logic.

## 20.6 Phase-4 scope
- Frontend: `app/(workspace)/` route group + adaptive panel components + `store/workspaceStore.ts`.
- Backend: `workspace.py` router reusing runtime.

## 20.7 Panel components (initial)
| Component | Panel |
|-----------|-------|
| FilePanel | Files |
| ResearchPanel | Research |
| ResultPanel | Results |
| AnalysisPanel | Analysis |
| ToolPanel | Tools |
| AgentActivityPanel | Agent Activity |
| BrowserPanel | Browser |
| ExecutionPanel | Execution |
| TaskStatePanel | Task State |
| WorkspaceChat | Chat/Instruction |

Visibility driven by `TaskType` + events (e.g., browser panel only when browser agent active).

## 20.8 Phase-4 detail
- Use shadcn/ui + Framer Motion (locked stack) for premium adaptive feel (final visual design later per Phase 1 §4 "do not implement final visual design yet").
- State in `store/workspaceStore.ts`; realtime via `lib/realtime.ts`.
- Tests (22/UI): panels adapt to task type; action routes to runtime; not-IDE (no code-editor-only focus); distinct from Instruction layout.

## 20.9 Consistency with Instruction
- Both modes use the SAME `app/runtime` core and SAME contracts/events. Difference is UX layer only (Phase 1 §4). No duplicated agent logic.
