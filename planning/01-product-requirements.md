# 01 — Product Requirements

Source: Master Project Specification §2, §3, §4, §9.

## Goal
Build a general-purpose **AI Agent Platform** — not a simple chatbot. The system receives arbitrary user tasks and completes them using an intelligent agent runtime, orchestration, specialized sub-agents, tools, multiple LLM providers/models, memory, verification, and recovery mechanisms.

## Locked execution flow
```
USER REQUEST → UNDERSTAND → CHECK CONTEXT/MEMORY → CLASSIFY TASK → PLAN
→ ORCHESTRATE → SELECT MODELS/TOOLS/SUB-AGENTS → EXECUTE → OBSERVE
→ VERIFY → FIX/RETRY/RE-PLAN (when required) → VERIFY AGAIN → FINAL RESULT
```

## Two user modes (locked)
- **Mode A — Instruction:** autonomous. The user gives a natural-language instruction ("Research this", "Build this", "Fix this"). The Main Agent + Orchestrator decide plan, sub-agents, tools, models, execution order, verification, and recovery — unless the user specifies constraints.
- **Mode B — Workspace:** a general interactive environment (NOT a coding IDE, NOT a Codex clone). It adapts to the task and may expose files, research, results, generated artifacts, analysis, tools, agent activity, sub-agent activity, browser work, execution information, and task state.

## UX principle (locked)
Instruction and Workspace are **different purpose-built UI experiences** sharing the **same underlying AI core**. Separation is primarily at the user-experience layer. Do not build one IDE-like interface and reuse it for both.

## Operation model
- **Autonomous orchestration:** user provides a goal; system determines strategy.
- **User-guided orchestration:** user may specify a sub-agent, model, tool, order, first step, or something to avoid. The Orchestrator incorporates valid user instructions. User guidance does **not** remove security/permission constraints.

## Out of scope (this phase)
Final visual design (§4) and full implementation. The platform must remain modular so capabilities can be added later without rewriting core architecture.
