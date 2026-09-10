# 04 — Core Contracts

Shared data contracts used across all layers (mirrored as TypeScript types in `frontend/lib/types.ts`). Defined here once to prevent drift. These are specifications, not code; Phase 4 implements them as Python `pydantic` models (backend) and TS interfaces (frontend).

## Convention
- All identifiers are UUIDv4 strings.
- All timestamps are UTC ISO-8601.
- All enums are closed sets; new values require a spec change (no ad-hoc strings).
- Each contract has `id`, `created_at`, and (where mutable) `status`.

---

## 4.1 Task
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| conversation_id | UUID | Owning conversation |
| user_id | UUID | Owner |
| intent | TaskIntent | Parsed user goal |
| plan | Plan | Current orchestration plan |
| status | TaskStatus | see §4.2 |
| current_step_id | UUID\|null | Active step |
| created_at | ISO | |
| updated_at | ISO | |
| final_result | Result\|null | Set when terminal |
| metadata | JSON | user constraints, mode (instruction/workspace), tags |

## 4.2 TaskStatus (enum)
`created → planning → executing → verifying → (paused\|failed\|completed)`
- `paused`: awaiting user approval/permission.
- `failed`: terminal after exhausted retries/recovery.
- `completed`: terminal with accepted final result.

## 4.3 TaskIntent
| Field | Type | Notes |
|-------|------|-------|
| raw | str | Original user text |
| goal | str | Normalized objective (from Main Agent) |
| constraints | list[Constraint] | user-specified model/agent/tool/order limits |
| mode | enum | `instruction` \| `workspace` |
| classification | TaskType | see §4.4 |

## 4.4 TaskType (enum)
`research`, `analysis`, `code`, `write`, `debug`, `fix`, `review`, `test`, `browser`, `file`, `verify`, `security`, `mixed`, `unknown`.

## 4.5 Plan
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| steps | list[Step] | |
| edges | list[Dependency] | DAG edges |
| strategy | enum | `sequential` \| `parallel` \| `mixed` |
| verification_points | list[UUID] | step ids requiring verification |
| created_by | enum | `agent` \| `user` |
| version | int | increments on replan |

## 4.6 Step
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| goal | str | What this step achieves |
| assigned_agent | SubAgentRole\|null | chosen by orchestrator |
| tool_ids | list[str] | candidate tools |
| input_refs | list[Ref] | references to previous results/artifacts |
| status | StepStatus | see §4.7 |
| result | Result\|null | output |
| retry_count | int | current retries |
| depends_on | list[UUID] | resolved deps |

## 4.7 StepStatus (enum)
`pending → running → (succeeded\|failed\| verifying\| awaiting_permission)`.

## 4.8 Dependency
`{ from: UUID(step), to: UUID(step), kind: enum(blocks, feeds) }` — defines DAG for execution order + parallelism.

## 4.9 Result
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | |
| step_id | UUID | |
| status | enum | `success` \| `partial` \| `failure` |
| artifacts | list[Artifact] | |
| summary | str | human-readable |
| metrics | JSON | tokens, duration, etc. |
| error | ErrorInfo\|null | present when failure |

## 4.10 Artifact
`{ id, type: enum(text|file|image|data|link|code|other), name, ref, size?, mime?, created_at }`.

## 4.11 ErrorInfo
`{ code, message, source: enum(llm|tool|agent|system|provider), retryable: bool, details: JSON }`.

## 4.12 Constraint
`{ kind: enum(model|sub_agent|tool|order|scope|permission), value: str, enforced: bool }`. User guidance only; never overrides security.

---

## 4.13 Tool
| Field | Type | Notes |
|-------|------|-------|
| id | str | unique stable id |
| metadata | ToolMetadata | see §4.14 |
| impl_kind | enum | `native` \| `mcp` |
| endpoint | str\|null | for MCP |
| handler_ref | str | internal handler id |

## 4.14 ToolMetadata
`{ name, description, input_schema (JSON Schema), output_schema (JSON Schema), permissions: list[Permission], execution: enum(sync|async|streaming), error_handling: enum(retry|fail|fallback), category: enum(web|search|files|code|terminal|browser|calculator|custom), cost_class: enum(cheap|moderate|expensive) }`.

## 4.15 ToolInvocation
`{ id, tool_id, params: JSON, context_refs: list[Ref], permission_ticket: UUID|null, caller: (step_id|user_id), timeout_ms }`.

## 4.16 ToolResult
`{ id, invocation_id, status: enum(success|failure|permission_denied|timeout), output: JSON, artifacts: list[Artifact], error: ErrorInfo|null, duration_ms }`.

## 4.17 Ref
Pointer to a result/artifact: `{ kind: enum(result|artifact|memory|context), id }`. Used for `input_refs`/`context_refs`.

---

## 4.18 SubAgentContract (decision 04)
Common interface for all 14 runtime sub-agents.
| Field | Type | Notes |
|-------|------|-------|
| role | SubAgentRole (enum) | research, deep_reading, analysis, planning, coding, writing, debug, fix, review, testing, browser, file, verification, security |
| run(context) | async fn | signature only: inputs `SubAgentContext`, returns `SubAgentResult` |
| input_schema | JSON Schema | required context fields |
| output_schema | JSON Schema | result shape |
| capabilities | list[ToolId] | tools it may use |
| model_preferences | list[ModelId] | preferred model tiers |
| max_retries | int | per-contract retry budget |
| verification_aware | bool | whether to self-verify |
| fallback_role | SubAgentRole\|null | role to hand off on failure |

- A sub-agent is **not** an independent agent (Phase 1 §6, §14). It is created/selected/monitored through `SubAgentManager` + Orchestrator.
- Reasoning requirement (Phase 1 §8): `run` must produce rationale in `SubAgentResult.rationale`, not just raw output.

## 4.19 SubAgentContext
`{ task_id, step_id, goal, inputs: list[Ref], memory: ContextBundle, tools: list[Tool], model_hint: ModelId|null, constraints: list[Constraint] }`.

## 4.20 SubAgentResult
`{ role, status: enum(success|partial|failure), output: JSON, rationale: str, artifacts: list[Artifact], verification: VerificationResult|null, error: ErrorInfo|null }`.

## 4.21 LLMRequest (gateway)
`{ id, provider: ProviderId|null, model: ModelId|null, credential_profile: CredentialProfileId|null, messages: list[Message], params: JSON (temp, max_tokens...), capability: enum(chat|completion|embedding|vision|function), context_refs: list[Ref], trace_id }`.

## 4.22 LLMResponse
`{ id, provider, model, profile, content: JSON, usage: Usage, latency_ms, status: enum(success|failure|filtered), error: ErrorInfo|null }`.

## 4.23 Usage
`{ prompt_tokens, completion_tokens, total_tokens, cost_units }`.

---

## 4.24 Event (envelope)
`{ id, type: EventType, task_id, step_id?, actor: enum(system|user|agent|tool|llm), timestamp, payload: JSON, seq: int }`.
EventType (enum): `task_created, plan_updated, step_started, step_completed, step_failed, tool_invoked, tool_result, llm_called, llm_result, sub_agent_selected, sub_agent_result, verification_started, verification_result, permission_requested, permission_resolved, task_paused, task_resumed, task_completed, task_failed, error, info`.

## 4.25 ContextBundle (decision 05)
`{ layers: list[ContextLayer], assembled_at, token_estimate, compressed: bool }`.
ContextLayer = `{ id, kind: enum(conversation|task_state|result|memory|instruction|tool_result|agent_state), source_ref: Ref, content_ref: str, tokens, importance: float (0..1), created_at }`.

## Phase-4 implementation note
Implement each as `pydantic` `BaseModel` in `app/core/*.py`; mirror in `frontend/lib/types.ts`. Version fields must be present; migrations tracked in `16-data-persistence`.
