# 17 — Testing Architecture

Defines the testing architecture before implementation. Source of truth: Phase 1 `13-testing-strategy.md` and spec §18. No tests written.

## Layers (locked from spec §18)
- unit tests — individual components/functions in isolation
- integration tests — components wired together (Runtime + Gateway, Runtime + Tool Manager)
- agent tests — Main Agent / Planner behavior on scripted intents
- orchestrator tests — decomposition, scheduling, parallel/sequential, retry/fix/replan
- sub-agent tests — per-category contract (input -> output, failure typing)
- tool tests — Tool Registry interface, permission check, normalization, error policy
- MCP tests — MCP client invocation + normalization against a mock MCP server
- LLM router tests — eligibility/fallback/retry with mocked providers
- memory/context tests — assembly, compression, retrieval, promotion
- API tests — endpoint responsibility/contract (FastAPI)
- realtime tests — event delivery over WebSocket/SSE (transport per OPEN decision)
- UI tests — mode separation, surface rendering, approval flows
- end-to-end tests — full Instruction/Workspace task through the stack
- failure/recovery tests — inject TRANSIENT/DEFECT/INVALID and assert correct path + budgets

## Mock vs real integration
| Test type | Mock | Real |
|-----------|------|------|
| LLM router | mock providers (deterministic) | optional smoke against configured profile |
| Tool/MCP | mock tool servers | selected real tools in sandbox |
| Gateway | mock provider endpoints | none in CI (cost/terms) |
| Orchestrator | scripted sub-agents/tools | none required |
| End-to-end | scripted external services | sandbox-only, no production keys |

## Principles
- Tests must not require provider API keys in CI.
- Failure/recovery tests must exercise the budget limits (10-verification-and-recovery.md).
- UI tests assert Instruction != chatbot and Workspace != IDE (11, 12).

## Constraints
No test implementation now (Phase 2 boundary, §26). Phase 3 produces the test suite against this architecture.
