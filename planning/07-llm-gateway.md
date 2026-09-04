# 07 — LLM Gateway

Source: Master Project Specification §10.

## Principle (locked)
Agents must **NOT** directly depend on individual LLM providers. A dedicated **LLM Gateway / Router** abstraction sits between agents and models.

## Conceptual flow (§10)
```
Agent → LLM Gateway → Router → Eligible Provider / Model / Credential Profile → LLM → Response → Agent
```

## Required capabilities (eventual, §10)
- provider abstraction
- model abstraction
- capability information
- availability
- usage tracking
- quota state
- failure state
- retry
- fallback
- provider/model selection

## Constraints (§10, §19)
- Multiple legitimately available provider credentials/profiles may be configured.
- Must respect provider terms, quotas, rate limits, and usage restrictions.
- Do **NOT** implement mechanisms intended to bypass provider restrictions.
- Do **NOT** expose provider API keys to the frontend.

## Deferred
The **detailed routing algorithm** is specified separately (later task), not in this planning phase.
