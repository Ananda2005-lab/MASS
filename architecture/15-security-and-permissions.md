# 15 — Security and Permissions

Defines security boundaries. Source of truth: Phase 1 `11-security.md` and spec §19. No mechanisms implemented.

## Boundaries
- **Authentication:** verify caller identity on every API/Realtime connection.
- **Authorization:** verify caller is permitted for the operation and scope (e.g., only owner sees their Conversation).
- **Tool permissions:** every tool declares `permission_requirements`; Tool Manager checks before execute (06).
- **User approvals:** destructive or high-impact actions require explicit approval (see list below).
- **API-key protection:** provider keys live only in CredentialProfiles (backend), encrypted at rest; never sent to frontend.
- **Secret handling:** secrets injected at runtime via config/secret store; never logged; never exposed in events.
- **Command restrictions:** Terminal/custom tools run under a restricted, sandboxed command set.
- **Sandboxing:** code execution isolated; host access bounded.
- **Rate limiting:** per user/key at API and Gateway layers.
- **Audit logs:** security-relevant actions recorded (16).

## Operations requiring explicit user approval
- Destructive filesystem ops (delete, overwrite outside workspace).
- Terminal commands flagged high-risk (per permission policy).
- External writes (send email, post, deploy).
- Use of a CredentialProfile outside the user's allowed set.
- Any tool the permission policy marks `ask`.

## Enforcement points
- Frontend request -> API authn/authz.
- Tool call -> Tool Manager permission check -> approval prompt if `ask`.
- Model call -> Gateway (no key exposure to agent).
- User guidance (03) never overrides these constraints.

## Constraints
- No provider API keys in frontend (Phase 1 §19).
- No unrestricted host-machine access to agents.
- User-guided orchestration does not remove security constraints (spec §9).
