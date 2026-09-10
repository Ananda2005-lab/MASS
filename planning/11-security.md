# 11 — Security

Source: Master Project Specification §19, §20.9, §20.10.

## Principles (locked, §19)
- Security must be considered from the beginning.
- Do **NOT** expose provider API keys to the frontend.
- Do **NOT** provide unrestricted host-machine access to agents.
- Tools must eventually pass through permission controls.
- Code execution must eventually be sandboxed.
- Potentially destructive operations must have appropriate permission/approval mechanisms.

## Mechanisms (§18)
- permission layer
- API-key protection
- sandboxing
- command restrictions
- user approval
- rate limiting
- audit logs

## Opencode-level enforcement (this repo)
- `.opencode/opencode.json` defines `permission.bash` rules: destructive commands (`rm`, `rm -rf`, `git push`, `git reset`) are denied/asked; read-only git/ls/cat allowed.
- The `security-agent` subagent audits for secret exposure and missing permission gates.
- The `project-context.js` plugin injects the spec's hard rules into every session.

## User guidance caveat (§9)
User-guided orchestration never removes security/permission constraints.
