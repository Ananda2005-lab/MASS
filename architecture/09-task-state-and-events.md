# 09 — Task State and Events

Defines persistent task state and the realtime event vocabulary. Source of truth: Phase 1 `09-task-state.md` and spec §14. No implementation.

## Persistent task state (per Task)
| Field | Meaning |
|-------|---------|
| task_id | unique id |
| conversation_id | owning conversation |
| user | initiator |
| current_state | lifecycle state (see 02) |
| current_step | active step id |
| plan | full Plan (steps + edges) |
| agent_executions[] | sub-agent run records |
| tool_calls[] | tool execution records |
| llm_calls[] | gateway request records |
| results{} | step result_ref -> payload |
| errors[] | typed failures |
| timestamps{} | created/updated/completed |
| completion_state | COMPLETED / FAILED / CANCELLED |

This is the recovery substrate: on RETRY/FIX/REPLAN the Orchestrator resumes from preserved `results` and `plan` rather than restarting.

## Event vocabulary (for realtime UI updates)
| Event | Payload |
|-------|---------|
| TASK_CREATED | task_id, goal, mode |
| PLAN_CREATED | task_id, plan |
| AGENT_STARTED | task_id, step_id, sub_agent |
| AGENT_COMPLETED | task_id, step_id, result_ref |
| TOOL_STARTED | task_id, step_id, tool, category |
| TOOL_COMPLETED | task_id, step_id, tool, status |
| LLM_STARTED | task_id, step_id, capability_requirement |
| LLM_COMPLETED | task_id, step_id, model_used, provider, tokens |
| VERIFICATION_STARTED | task_id, step_id |
| VERIFICATION_COMPLETED | task_id, step_id, verdict |
| RETRY_STARTED | task_id, step_id, attempt |
| REPLAN_STARTED | task_id |
| TASK_COMPLETED | task_id, final_result_ref |
| TASK_FAILED | task_id, reason |
| TASK_CANCELLED | task_id |

## Event rules
- Every event carries `task_id` and a timestamp.
- Events are emitted by the Orchestrator/Executors through the Realtime gateway (13-backend-api-and-realtime.md).
- Events contain only UI-visible state (status, names, counts, result references) — never raw credentials, full tool payloads, or internal reasoning (see 15-security-and-permissions.md).
- UI subscribes per `conversation_id` / `task_id`.
