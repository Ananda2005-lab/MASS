# 17 — Security

Implements Phase 1 §19, §20.9–20.13 and cross-cutting layer (03). Security from the beginning (Phase 1 §19). Principles: no provider keys in frontend, no unrestricted host access, permission layer on tools, sandbox code exec, approval for destructive ops, rate limiting, audit logs.

## 17.1 Authentication & Authorization
- `app/security/auth.py`: token-based auth for API (15) and Realtime (14). Users authenticated; each request scoped to `user_id`.
- Authorization: user may access only own conversations/tasks/memory. Enforced at API + state read paths.
- Service-to-service internal calls use scoped internal tokens (config), never user tokens.

## 17.2 Permission layer (tools, 11)
- `app/security/permissions.py`: evaluates `ToolMetadata.permissions` against policy + user approvals.
- Each risky/destructive tool requires approved `permission_ticket` (UUID) before exec (11.6).
- User approval flow: `permission_requested` event → user approves via API/WS → `permission_resolved` → ticket issued → tool runs.
- Unapproved → `ToolResult.status=permission_denied`.

## 17.3 Secrets management
- `app/security/secrets.py`: provider credentials (`CredentialProfile.key_ref`) resolved at Gateway call time only (09.7). Never exposed to frontend, logs, or events.
- Secrets stored in env/secret store (e.g., env var or vault), not in code or DB plaintext.
- API responses and `Event.payload` are scrubbed of secret patterns (scan/redact).
- Frontend NEVER receives provider API keys (Phase 1 §19).

## 17.4 Audit logs
- Every mutating action (task create, tool invoke, permission resolve, model select) written to audit log (PostgreSQL + observability).
- Audit includes actor, action, target, timestamp, outcome. Tamper-resistant (append-only).
- Supports operator review + compliance.

## 17.5 Rate limiting & quotas
- API rate limits per user (Redis counters).
- LLM quotas enforced in Gateway (09.6) — respects provider terms; no bypass (09.7).
- Tool exec limits (e.g., concurrent terminal sessions) configurable.

## 17.6 Sandboxing & command restrictions
- Code/terminal execution (`code.run`, `terminal.exec`) MUST run sandboxed (container/limited env) per Phase 1 §19. Phase 4 defines sandbox runtime (Docker/isolated process) — architecture only here.
- Command restrictions: deny-list/allow-list for dangerous commands; path scoping for file tools (no escape outside allowed roots).
- Browser tool confined to permitted origins/policies.

## 17.7 User approval & security constraints
- Destructive operations require explicit user approval OR operator policy allow (17.2).
- User constraints (Phase 1 §9) never override security constraints (e.g., cannot ask to disable permissions or bypass provider terms).
- Genuine ambiguity / safety → `task_paused` for user decision, not silent action.

## 17.8 Anti-patterns (locked)
- No provider keys in frontend/logs/events (Phase 1 §19).
- No unrestricted host access (Phase 1 §19).
- No tool runs without permission check (11/17.2).
- No code exec outside sandbox (Phase 1 §19).
- No quota/rate-limit bypass (Phase 1 §10/§19).

## 17.9 Phase-4 modules
- `app/security/auth.py`, `permissions.py`, `secrets.py` + audit sink in `observability`.
- Integration: API (15) and Realtime (14) call auth; Tool Manager (11) calls permissions; Gateway (09) calls secrets.
- Tests (22): unauthorized rejected, secret redaction in logs/events, permission gating blocks unapproved destructive, sandbox isolates (where testable), audit entries written.
