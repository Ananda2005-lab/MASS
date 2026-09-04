# PROJECT STATUS — AI Agent Platform (RAG-V2)

> Ye file project ka single source of truth hai — koi bhi isko dekh ke samajh jayega ki ab tak kya kaam hua hai.
> Last updated: 2026-08-29

---

## 1. PROJECT KA PURPOSE

**General-purpose AI Agent Platform** — chatbot nahi.

User koi bhi task deta hai (research, coding, analysis, writing, files...), system autonomously:
UNDERSTAND → PLAN → ORCHESTRATE → EXECUTE (sub-agents + tools) → VERIFY → RETRY/RE-PLAN → RESULT

**Do UI modes (ek hi AI core):**
- **Nova** (Chat/Instruction) — autonomous mode: user instruction de, system sab khud kare
- **Forge** (Work/Workspace) — interactive mode: user agent ke saath kaam kare, sab live dikhe

**Entry page** — ek screen, 2 premium cards: Nova & Forge (Codex-style)

---

## 2. BACKEND (PEHLE BANA — COMPLETE, ABHI TOUCH NAHI KARNA)

| Area | Status | Detail |
|---|---|---|
| Planning docs | ✅ | 15 files (`planning/`) |
| Architecture docs | ✅ | 18 files (`architecture/`) |
| Implementation blueprint | ✅ | 28 files (`implementation/`) |
| Runtime pipeline | ✅ | MainAgent → Planner → Orchestrator → Executor → 14 sub-agents → Verifier (end-to-end chalta hai) |
| Tools | ✅ | files, terminal, calculator, browser + Agent→Tool loop (Step 1 done) |
| LLM Gateway | ✅ | Real weighted router — **sirf Fake adapter** (real LLM keys nahi lagi) |
| Database | ✅ | SQLAlchemy (SQLite/Postgres), 6 tables |
| Realtime | ✅ | WebSocket + SSE |
| Security | ✅🟡 | Auth + permission code hai, API pe enforce nahi |
| Tests | ✅ | 74 passing |
| **LLM real adapters** | ✅ | **OpenRouter + Groq + Google AI Studio — 16 keys, daily quota rotation** |
| **LLM keys** | ✅ | `backend/.env` (git-ignored), `Api keys.md` reference |
| Phase 6 (production) | ⚪ | Not started |

**Master spec:** `Master Project Specification — AI Agent Platform.md`

---

## 3. NEW UI (`new-ui/`) — ABHI KAAM CHAL RAHA YAHAN HAI

Purana `frontend/` untouched hai. Naya UI scratch se alag folder me ban raha hai.

### Finalized Decisions
| Cheez | Decision |
|---|---|
| Stack | Next.js 16 + React 19 + TypeScript + Tailwind |
| Port | **3900** (`npm run dev`) |
| Entry bg | **#49 Firefly Grove** (jugnu, jungle, moon) |
| Nova bg | **#21 JARVIS Core** (holographic AI core) |
| Forge bg | **#8 Nebula** (deep space + shooting stars) |
| Background swap | 1 line: `new-ui/config/backgrounds.ts` |
| Naming | Chat = **Nova** · Work = **Forge** |
| FX engine | Custom canvas engine (`new-ui/lib/fx/`) — 3 effects ready |

### Steps Progress
| Step | Kaam | Status |
|---|---|---|
| **0** | Foundation — project setup, FX engine, 3 backgrounds, routing | ✅ DONE |
| **1** | Entry page — brand, Nova/Forge cards, tilt+sheen hover, transitions, keyboard shortcuts (1/2), screen-wide animations (float/shimmer/glow-pulse) | ✅ DONE |
| **2** | Forge page | ✅ DONE — Phases 1-10 complete (spec: FORGE_Workspace_Layout_and_Prompt.md) |
| **3** | Nova page | ⬜ Forge ke baad |
| **4** | Page transitions polish | ⬜ |
| **5** | Backend wiring (API + realtime) | ⏳ IN PROGRESS — Step A done, B-F pending |

### Forge (Phases 1-10 — COMPLETE)
| Phase | Kaam | Status |
|---|---|---|
| 1 | Foundation — theme tokens, glass components, Nebula bg | ✅ |
| 2 | Top Nav + Layout Shell (sidebars, bottom bar) | ✅ |
| 3 | Panel Grid (drag/resize/maximize/restore dock, v2 API) | ✅ |
| 4 | Execution Dashboard (thought tree, action card, history, overrides) | ✅ |
| 5 | Research & Context (4 tabs: Search/RAG/Pinned/Browser) | ✅ |
| 6 | Output Canvas (5 tabs: Terminal/Monaco/Preview/Data/Whiteboard) | ✅ |
| 7 | Left Sidebar (explorer, agents, tools, KB, integrations) | ✅ |
| 8 | Right Sidebar (config, tools, vars, queue) | ✅ |
| 9 | Bottom Command Bar (slash cmds, attach, voice, terminal slide-up) | ✅ |
| 10 | Advanced (⌘K palette, Agent Orb, toasts, zen, split, responsive) | ✅ |

### Mock Data (centralized)
- **`new-ui/lib/mock/data.ts`** — saari fake data ek jagah, clearly labelled MOCK
- Har component inline data nahi, wahan se import karta hai
- Workspace pe **yellow "MOCK DATA" badge** dikhta hai
- Backend wire hote hi is file ko real API module se replace karna hai

---

## 4. KAISE CHALAYEIN

```powershell
cd "C:\Users\anand\Desktop\Gen AI\Multi Agent System\new-ui"
npm run dev
```
Browser: **http://localhost:3900**
(Pehli request pe page compile hota hai — thoda slow, uske baad fast)

Pages:
- `/` → Entry (Nova + Forge)
- `/workspace` → Forge (skeleton — instruction pending)
- `/instruction` → Nova (skeleton)

Backgrounds reference (50 designs): `references\rag-v2-backgrounds.html` browser me kholo.

---

## 5. FILE MAP (new-ui/)

```
new-ui/
├── app/
│   ├── page.tsx              → Entry page (Nova/Forge cards) ✅
│   ├── instruction/page.tsx  → Nova (skeleton) ⏳
│   ├── workspace/page.tsx    → Forge (skeleton — reset kiya) ⏳
│   ├── layout.tsx, globals.css
├── components/
│   ├── FxBackground.tsx      → background canvas wrapper
│   ├── ModeCard.tsx          → Nova/Forge card (tilt + sheen)
│   ├── BrandMark.tsx, icons.tsx
├── lib/fx/
│   ├── core.ts               → canvas engine (DPR, RAF, mouse, visibility)
│   ├── registry.ts           → fx mapping
│   └── effects/ → firefly.ts, jarvis.ts, nebula.ts
├── config/backgrounds.ts     → screen→background mapping (1-line swap)
```

---

## 6. RULES (USER NE LOCK KIYE)

1. **Backend ko haath NAHI lagana** — sirf `new-ui/` me kaam
2. Har step: build → user test/approve → agla step
3. Layout banane se pehle **user ka exact instruction prompt** — apne se design guess nahi karna
4. Backgrounds swappable rahen (registry)
5. Premium quality — subtle animations, glass, dark theme
