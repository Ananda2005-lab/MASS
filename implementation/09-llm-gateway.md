# 09 — LLM Gateway

Implements Phase 1 §10 and Phase 2.1 decision 02. Agents never depend on individual providers (Phase 1 §10). Gateway = abstraction over Provider × Model × CredentialProfile with router, fallback, retry, cooldown, health/quota. No provider restriction bypass (Phase 1 §10, Phase 2.1 decision 02). Provider SDKs live ONLY here.

## 9.1 Conceptual flow (locked)
`Agent → LLM Gateway → Router → (Provider, Model, CredentialProfile) → LLM → Response → Agent`.

## 9.2 Entities
- **Provider**: `{ id, name, kind, base_url, adapter_ref, capabilities: list[enum], status }`. Adapter is the only place importing the provider SDK.
- **Model**: `{ id, provider_id, name, capability_tags, context_window, cost_unit, tier }`.
- **CredentialProfile**: `{ id, provider_id, key_ref (secret store), quota: QuotaState, rate_limit, allowed_models, terms_scope }`. Multiple legitimately available profiles may be configured (Phase 1 §10).
- **RoutingContext**: capability, estimated tokens, user `model` constraint, cost preference, latency preference.

## 9.3 Router — Weighted Candidate Scoring (decision 02)
For each eligible (Provider, Model, CredentialProfile) tuple:
1. **Filter**: capability match (required `capability` in model/provider tags), profile allows model, profile not exhausted/blocked, provider healthy, credential valid.
2. **Score** each candidate:
   `score = w_capability*s_capability + w_cost*s_cost + w_latency*s_latency + w_reliability*s_reliability + w_constraint*s_constraint`
   - `s_capability`: exact match / tier fit.
   - `s_cost`: lower cost → higher score (from `cost_unit`).
   - `s_latency`: lower historical latency → higher.
   - `s_reliability`: from HealthState (success rate, cooldown active?).
   - `s_constraint`: 1.0 if matches user `model` constraint else partial.
   Weights in `config/` (operator-scoped). No quota bypass: filter excludes exhausted profiles BEFORE scoring.
3. **Select**: highest score; tie-break by reliability then cost.
4. **Fallback chain**: precompute ordered candidates for when primary fails.

## 9.4 Selection output
Returns chosen `(provider, model, credential_profile)` + fallback list. Emits `llm_called` with selection rationale (for audit/observability).

## 9.5 Failure handling
- Provider/model failure → try next in fallback chain (different profile/model, same capability).
- Rate limit (429) → respect `Retry-After`; mark CooldownState; route elsewhere.
- Exhausted quota → exclude profile; if none remain → typed failure to caller (no bypass).
- All candidates failed → return `LLMResponse.status=failure` with `ErrorInfo.source=provider`; Orchestrator recovery (06.4).

## 9.6 Retry / Cooldown / Health / Quota (decision 02)
- **Retry**: provider-transient errors retried with backoff up to `config` max; not for permanent errors.
- **CooldownState**: `{ provider_model_profile, until: ISO, reason }`. Router excludes cooled-down candidates.
- **HealthState**: tracked per candidate — success rate, last error, latency rolling avg. Informs `s_reliability`.
- **QuotaState**: `{ used, limit, window, reset_at }`. Updated on each `Usage`. Exhausted → filtered out. Respects provider terms/windows (no manipulation).
- **Usage tracking**: every `LLMResponse.usage` persisted for quota, cost, audit (Phase 1 §10 "usage tracking").
- **Failure state**: persisted; surfaces in observability + operator config.

## 9.7 Anti-bypass rules (Phase 1 §10, decision 02)
- Gateway MUST respect provider terms, quotas, rate limits, usage restrictions.
- No mechanism that evades provider restrictions (e.g., key rotation to dodge limits, hidden retries).
- Credential secrets never leave `security/secrets`; adapters receive only resolved credentials at call time.
- Provider SDKs confined to `app/gateway/*/adapters`; a bad adapter returns typed failure, never crashes core.

## 9.8 Capability abstraction
`capability` enum (chat, completion, embedding, vision, function) lets router match without knowing provider internals. New provider = new adapter + model/credential config; no core change.

## 9.9 Phase-4 modules
- `app/gateway/provider.py`, `model.py`, `credential_profile.py`, `router.py`, `fallback.py`, `retry.py`, `health_quota.py`.
- `app/gateway/adapters/` (one per provider; only place with provider SDK).
- `config/providers.yaml` (profiles, weights, quotas) — operator-scoped.
- Tests (22): filter correctness, scoring ordering, fallback chain, cooldown exclusion, quota exhaustion (no bypass), secret isolation.
