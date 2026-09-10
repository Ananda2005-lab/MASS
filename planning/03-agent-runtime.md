# 03 — Agent Runtime

Source: Master Project Specification §5, §8, §9.

## Roles (locked, §5)
| Component | Responsibility |
|-----------|----------------|
| Main Agent | General-purpose entry; understands the request and drives autonomous/user-guided flow. |
| Planner | Decomposes goals into plans/milestones. |
| Orchestrator | Central execution controller (see 04-orchestration.md). |
| Executor | Runs steps/tools as directed by the Orchestrator. |
| Verifier | Checks generated results against requirements (see 08/15). |
| Sub-Agent Manager | Creates, selects, delegates to, monitors, evaluates sub-agents. |
| Tool Manager | Registers and controls tool access through permission interfaces. |
| Memory Manager | Owns conversation context, task state, prior results, agent state. |

## Quality requirement (§8)
Every component performs **intelligent contextual work**, not mechanical pass-through. A reader is not "read file and return text"; it must understand context appropriate to its task. The same applies to writers, debug, fix, research, analysis, testing, review.

## Operation modes (§9)
- **Autonomous:** system determines execution strategy from the goal.
- **User-guided:** explicit user constraints (sub-agent / model / tool / order / first step / avoidance) are incorporated by the Orchestrator.

## Boundaries
- Sub-agents are managed, never uncontrolled independent agents (§6, §20.14).
- Agents reach models only through the LLM Gateway (§10).
- Agents reach tools only through the Tool Manager (§11).
