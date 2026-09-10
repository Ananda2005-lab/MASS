# 25 — Phase 4 Operating Rules (Locked)

Strict rules for the Phase 4 implementation engineer, derived from Master Spec §20 + this blueprint. These are NON-NEGOTIABLE. Violation = rework.

## 25.1 Do not guess
- If a requirement is genuinely ambiguous or contradictory, STOP and report. Do not invent architecture, requirements, or technical details (Master §20.1, §23, §24).
- This blueprint (implementation/) + Phase 1/2/2.1 are the spec. Any needed change → update spec first, then implement.

## 25.2 Do not redesign / replace
- Do NOT redesign the locked architecture (Master §20.2).
- Do NOT replace the selected technology stack (Master §20.3, §18). Python/FastAPI, Next.js/React/TS/Tailwind/shadcn/Zustand/Framer Motion, PostgreSQL/Redis/pgvector, Playwright, WS+SSE — all locked.
- Do NOT introduce an alternative architecture (Master §20.4).

## 25.3 Do not add unspecified features
- Do NOT add features not specified (Master §20.5). Out-of-scope: full vector memory, mobile/device (§11.7), extra sub-agent roles beyond 14 (08.3), final visual design (21.8).
- Do NOT modify unrelated files (Master §20.6).
- Do NOT create duplicate systems for the same responsibility (Master §20.7).

## 25.4 Do not bypass abstractions
- Do NOT bypass defined abstraction layers (Master §20.8): runtime→managers→gateway/tools/memory; API/realtime are boundaries; Gateway is sole provider-SDK holder (09.7).
- Agents NEVER directly depend on individual LLM providers (Master §10). Use Gateway.
- Sub-agents are managed, not independent (Master §6, §14); only Orchestrator/Manager delegate (08.5).

## 25.5 Do not expose secrets / unsafe access
- Do NOT expose provider API keys to frontend (Master §19, 17.3).
- Do NOT provide unrestricted host-machine access (Master §19). Sandbox code/terminal (17.6).
- Tools MUST pass through permission controls (Master §19, 11.6, 17.2).
- Respect provider terms/quotas/rate limits; no bypass (Master §10, 09.7).

## 25.6 Mode & sub-agent discipline
- Instruction and Workspace are DISTINCT purpose-built UIs sharing one core (Master §4, 19/20/21). Workspace is NOT a coding IDE (Master §20.12). Instruction is NOT a simple chatbot (Master §20.13).
- Keep the 14 sub-agent roles; no arbitrary new ones (Master §20.5, 08.3).
- Sub-agent quality bar: contextual reasoning + `rationale`, not raw dump (Master §8, 08.6).

## 25.7 Verification & recovery discipline
- Verify before accept (Master §15, 12). Verification points not skippable.
- Recovery only via retry/fallback/diagnose/fix/replan/verify, bounded (Master §16, 12.5). No invented behavior.
- Parallel execution only where dependencies allow (Master §17, 06.5).

## 25.8 Implementation hygiene
- Implement contracts in `app/core` (pydantic) + mirror in `frontend/lib/types.ts`; no drift.
- Each module has unit/integration tests (22).
- Lint + typecheck must pass (ruff/mypy; tsc/eslint).
- Structured logs, no secrets (18.1, 17.3).

## 25.9 Stop conditions (when to halt & report)
- Genuine ambiguity/contradiction in spec → STOP (Master §20.1).
- A locked decision appears impossible with chosen stack → report, do not swap stack.
- Any request to add future-scope (mobile/device, vector memory, new roles) → flag as future, do not implement (Master §20.11, §11/§12).
- Missing dependency for a task → block, report.

## 25.10 Completion definition (Phase 4)
Phase 4 complete only when:
- All 25 tasks (23) implemented per blueprint + pass tests (22).
- M1–M5 exit criteria met (24.4).
- Final audit (T25 / consistency-audit.md) shows zero locked-decision violations.
- Two modes distinct, share core; no provider keys leaked; security enforced.

## 25.11 Final reminder
This is the implementation engineer's contract. Build exactly the blueprint; nothing more, nothing less. When unsure, STOP and ask (Master §20.1).
