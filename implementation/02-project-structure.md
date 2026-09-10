# 02 — Project Structure

Exact implementation directory layout. Two deployable apps (backend, frontend) plus shared contract types. No vague placeholders.

```
multi-agent-system/
├── backend/                      # FastAPI service (Agent Core + API + Realtime)
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py               # FastAPI app factory, lifespan
│   │   ├── api/                  # HTTP routers (§15)
│   │   │   ├── conversations.py
│   │   │   ├── tasks.py
│   │   │   ├── instruction.py
│   │   │   ├── workspace.py
│   │   │   ├── tools.py
│   │   │   ├── results.py
│   │   │   └── config.py
│   │   ├── runtime/              # Agent Runtime (§05)
│   │   │   ├── main_agent.py
│   │   │   ├── planner.py
│   │   │   ├── orchestrator.py   # §06
│   │   │   ├── executor.py
│   │   │   ├── verifier.py
│   │   │   └── managers/
│   │   │       ├── sub_agent_manager.py
│   │   │       ├── tool_manager.py
│   │   │       └── memory_manager.py
│   │   ├── core/                # Contracts (§04)
│   │   │   ├── task.py          # Task, Plan, Step, Dependency, Result, Artifact
│   │   │   ├── tool.py          # Tool, ToolMetadata, ToolInvocation, ToolResult
│   │   │   ├── sub_agent.py      # SubAgentContract
│   │   │   ├── llm.py           # LLMRequest, LLMResponse
│   │   │   ├── event.py         # Event envelope + types
│   │   │   └── context.py       # ContextLayer, ContextBlock
│   │   ├── gateway/             # LLM Gateway (§09)
│   │   │   ├── provider.py
│   │   │   ├── credential_profile.py
│   │   │   ├── model.py
│   │   │   ├── router.py        # scoring/filter
│   │   │   ├── fallback.py
│   │   │   ├── retry.py
│   │   │   └── health_quota.py  # HealthState, QuotaState, CooldownState
│   │   ├── tools/               # Tool/MCP (§11)
│   │   │   ├── registry.py
│   │   │   ├── native/          # native tool impls (files, code, terminal, calc, browser)
│   │   │   └── mcp_adapter.py
│   │   ├── memory/              # Memory/Context (§10)
│   │   │   ├── assembler.py
│   │   │   ├── compressor.py
│   │   │   └── store.py
│   │   ├── state/               # Task State/Events (§13)
│   │   │   ├── task_state.py
│   │   │   └── event_bus.py
│   │   ├── verification/        # Verification/Recovery (§12)
│   │   │   ├── verifier.py
│   │   │   └── methods.py       # per-category methods
│   │   ├── persistence/         # Data (§16)
│   │   │   ├── models.py        # SQLAlchemy entities
│   │   │   └── repos.py
│   │   ├── realtime/            # Realtime (§14)
│   │   │   ├── websocket.py
│   │   │   └── sse.py
│   │   ├── security/            # Security (§17)
│   │   │   ├── auth.py
│   │   │   ├── permissions.py
│   │   │   └── secrets.py
│   │   └── observability/       # (§18)
│   │       ├── logging.py
│   │       └── tracing.py
│   └── tests/                   # mirrors app/ (§22)
├── frontend/                     # Next.js app (§21, §23)
│   ├── package.json
│   ├── app/
│   │   ├── (instruction)/        # Instruction Mode route group
│   │   └── (workspace)/          # Workspace Mode route group
│   ├── components/
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   ├── realtime.ts           # WS/SSE client
│   │   └── types.ts              # shared TS contracts (mirror core/)
│   ├── store/                    # Zustand stores
│   └── tests/
├── config/                       # operator config (provider profiles, perms, weights)
└── docs/                         # planning/ architecture/ implementation/ references
```

## Directory responsibilities (selected)
| Dir | Responsibility | Allowed deps | Forbidden deps | Layer |
|-----|---------------|--------------|----------------|------|
| `app/runtime` | Agent lifecycle + orchestration | core, gateway, tools, memory, state, verification | direct provider SDKs, DB models | Agent Core |
| `app/gateway` | Provider/model abstraction + routing | provider adapters, core | runtime orchestration logic | Agent Core |
| `app/tools` | Tool registry + native/MCP exec | core, security/permissions | orchestrator logic | Agent Core |
| `app/memory` | Context assembly/compression | state, persistence | provider SDKs | Agent Core |
| `app/state` | Task state + event bus | core, persistence | UI | Agent Core |
| `app/verification` | Verify/diagnose/fix loop | core, tools | orchestrator control | Agent Core |
| `app/api` | HTTP boundary | runtime, state, security | direct LLM calls | API |
| `app/realtime` | WS/SSE transport | state/event_bus, security | business logic | API |
| `app/security` | Authn/authz/secrets | config | business logic | Cross-cutting |
| `app/observability` | Logs/traces | all | none | Cross-cutting |
| `app/persistence` | Entities/repos | DB drivers | runtime logic | Infrastructure |
| `frontend/app` | Two mode UIs | lib, store | core orchestration | UI |
| `frontend/lib` | API + realtime clients, types | none backend | backend logic | UI |
| `config` | Operator profiles/perms/weights | none | code | Config |

## Rules
- Frontend never imports backend runtime; only `lib/api.ts` + `lib/realtime.ts`.
- Runtime core never imports `app.api` or `app.realtime` (inversion: API/realtime call runtime).
- Gateway is the ONLY module that imports provider SDKs (keeps core provider-agnostic).
- No circular deps: `core` depends on nothing but itself; all layers depend on `core` contracts.

