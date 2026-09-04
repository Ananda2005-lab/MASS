# 07 — LLM Gateway and Router

Critical architecture document. Source of truth: Phase 1 `07-llm-gateway.md` and spec §10. No implementation.

## Purpose
The Gateway abstracts providers from the Agent Runtime. All model access flows:

```
Agent -> LLM Gateway -> Router -> Provider/Model/CredentialProfile -> LLM -> Response -> Gateway -> Agent
```

The Runtime never holds a provider SDK or API key directly.

## Concepts

| Concept | Meaning |
|---------|---------|
| Provider | An LLM vendor (e.g., Anthropic, OpenAI, Gemini). |
| Model | A specific model id at a provider. |
| CredentialProfile | A legitimately configured key/account + policy (quotas, allowed models, priority). |
| Capability | What a model can do (e.g., vision, long-context, code, function-calling). |
| Availability | Currently reachable / within limits. |
| Quota | Token/request allowance for a profile. |
| Usage | Consumed tokens/requests recorded per profile. |
| Priority | Preference ordering among eligible profiles. |
| Health | Recent success/failure rate of a provider/model. |
| Failure | Error from a provider/model call. |
| Fallback | Move to next eligible profile on failure. |

## Request representation
```
LLMRequest = {
  capability_requirement,    # what the step needs
  model_requirement?,        # optional preferred model (capability-level, set by Orchestrator)
  prompt/messages,
  max_tokens, temperature,
  metadata { task_id, step_id }
}
```

## Router decision (conceptual)
1. **Capability match:** keep providers/models whose capabilities satisfy `capability_requirement`.
2. **Profile eligibility:** keep CredentialProfiles configured and not exhausted/disabled.
3. **Availability:** drop providers currently unavailable (health/quota).
4. **Selection:** choose among eligible by Priority + Health (e.g., prefer healthier, higher-priority, lower-used).
5. **Provider/Credential selection** is separate from **Model selection**: model is chosen by capability; the credential/profile is chosen by eligibility/priority/health.

## Retry vs Fallback
- **Retry:** same provider/model, transient error (timeout/429 with retry-after), within retry budget.
- **Fallback:** switch to next eligible provider/model/profile after non-transient failure or budget exhaustion.

## Usage & quota
- Gateway records every call into UsageRecord (14-data-and-persistence.md).
- Quota state updated after each call; exhausted profiles become ineligible.
- Failures decrement Health; sustained failure marks provider temporarily unavailable.

## Provider terms
The system MAY efficiently use legitimately available free quotas, but MUST NOT implement quota bypassing, fake identities, rate-limit circumvention, or any violation of provider terms. All profiles are explicitly configured by the operator.

## Routing algorithm status (RESOLVED in Phase 2.1)
The concrete selection/scoring algorithm is resolved as **weighted candidate scoring** in `decisions/02-llm-router-decision.md`. This document defines the inputs, concepts, and boundaries; the scoring formula, fallback, retry, cooldown, and quota-exhaustion behavior are now locked there. No provider bypass is permitted (07, spec §10).
