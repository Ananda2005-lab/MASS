# 11 — Tool Architecture & MCP

Implements Phase 1 §11 and §12 (future device). Tools modular; controlled interface with name/description/input schema/output schema/permissions/execution/error handling. Native tools + MCP adapter. Future Device Tool/Manager added without rewriting runtime/orchestrator (Phase 1 §12).

## 11.1 Controlled Tool interface (§4.13–4.16)
Every tool exposes `ToolMetadata`:
- `name`, `description`
- `input_schema`, `output_schema` (JSON Schema)
- `permissions`: list[Permission] (required approvals/caps)
- `execution`: `sync`|`async`|`streaming`
- `error_handling`: `retry`|`fail`|`fallback`
- `category`: `web|search|files|code|terminal|browser|calculator|custom`

Invocation returns `ToolResult` (status, output, artifacts, error). No tool runs outside Tool Manager.

## 11.2 Tool Manager
Module: `app/runtime/managers/tool_manager.py`.
- Registry: `Tool` id → impl + metadata. Sources: native registry + MCP adapter discoveries.
- Resolve: given `tool_ids` + caller + `Permission` set → check permissions (via Security 17) → dispatch.
- Permission ticket: destructive/risky tools require approved `permission_ticket` (UUID) before exec.
- Result capture: wrap native/MCP output into `ToolResult`; emit `tool_invoked`, `tool_result`.
- Error handling per `error_handling` policy.

## 11.3 Native tools (initial categories, Phase 1 §11)
| Tool id | Category | Execution | Permissions | Notes |
|---------|----------|-----------|-------------|-------|
| web.fetch | web | async | network | HTTP fetch (respect robots/terms) |
| search.query | search | async | network | web search |
| files.read | files | sync | fs:read | safe path scope |
| files.write | files | sync | fs:write (ticket) | sandbox path |
| files.list | files | sync | fs:read | |
| code.run | code | async | exec (sandboxed, ticket) | sandbox required (19) |
| terminal.exec | terminal | async | exec (sandboxed, ticket) | command restrictions (19) |
| browser.* | browser | async | network | Playwright (Phase 1 §18) |
| calculator.eval | calculator | sync | none | safe math only |

Do NOT implement every tool now unless Phase 4 task says so; establish architecture/interface (Phase 1 §11). Phase 4 builds the ones required by initial sub-agents.

## 11.4 Tool categories (locked)
`web, search, files, code, terminal, browser, calculator, custom`. New category only via spec change.

## 11.5 MCP integration
Goal: reuse community/standard MCP servers as tools without forking (operational benefit).
- `app/tools/mcp_adapter.py`: connects to MCP server(s) (config in `config/mcp.yaml`), discovers tool list, maps each MCP tool → `Tool` with `impl_kind=mcp`, `endpoint`, `metadata` derived from MCP schema.
- Invocation: Tool Manager routes `mcp` tools to adapter → MCP server; result normalized to `ToolResult`.
- Failure: MCP server down → `ToolResult.status=failure`, `error.source=tool`; Tool Manager applies policy (retry/fallback). Core unaffected.
- Security: MCP tools still pass through Permission layer (17) before exec.

## 11.6 Permission enforcement (see 17)
- Each `ToolMetadata.permissions` checked by Security before exec.
- Destructive ops (write/exec) require approved `permission_ticket` (user approval or policy allow). Unapproved → `tool_result.status=permission_denied`, event `permission_requested`.

## 11.7 Future Device control (Phase 1 §12) — explicitly future
- Architecture allows `Device Tool` + `Device Manager` later: `Agent → Orchestrator → Tool Manager → Device Tool → Device Manager → Phone1/2/3`.
- Must NOT be implemented now (Phase 1 §11/§12, §20.11). Tool Manager's registry/adapter pattern already supports adding it without rewriting runtime/orchestrator. Documented as future extension only.

## 11.8 Anti-patterns (locked)
- No tool executes outside Tool Manager (bypasses permissions).
- No provider SDK inside tools (Gateway only).
- No host-wide unrestricted access (Phase 1 §19).
- No mobile control in initial phase (§11/§12).

## 11.9 Phase-4 modules
- `app/tools/registry.py`, `app/tools/native/*` (initial tools), `app/tools/mcp_adapter.py`.
- `runtime/managers/tool_manager.py` (delegation + permission gate).
- Tests (22): metadata validation, permission gating, MCP discovery+normalize, error policy, no-unapproved-destructive.
