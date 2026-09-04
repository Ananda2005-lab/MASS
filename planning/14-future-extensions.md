# 14 — Future Extensions

Source: Master Project Specification §12, §17, §20.11.

## Explicitly future scope (§12)
**Android / ADB / multi-device control** is a FUTURE capability. Do NOT implement it in the initial phase (§20.11).

### Anticipated future structure (§12)
```
Agent → Orchestrator → Tool Manager → Device Tool → Device Manager
→ Phone 1 / Phone 2 / Phone 3 / ...
```
The architecture must allow a future Device Tool / Device Manager to be added **without rewriting the Agent Runtime or Orchestrator**.

## Extensibility requirements (throughout spec)
- Modular platform: new sub-agents, tools, providers, and capabilities must be addable without rewriting core architecture (§2, §4, §7, §11).
- Parallel execution support for independent tasks (§17) is a current requirement, not future.
- Detailed LLM routing algorithm, verification strategies, and per-sub-agent implementations are **deferred to later tasks** (not future scope — they are planned next phases).

## Not in scope now
- Mobile/device control (future only).
- Final UI visual design (deferred until explicitly instructed).
- Full runtime, router, and tool implementations (later tasks).
