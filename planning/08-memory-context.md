# 08 — Memory / Context

Source: Master Project Specification §13.

## Architectural boundaries (locked, §13)
The system must define boundaries for:
- conversation context
- task state
- previous results
- important memory
- tool results
- agent state

## Eventual support (§13)
- context management
- context compression
- summarization
- relevant context retrieval

## Constraints
Do **NOT** implement an unnecessarily complex memory system unless explicitly specified in a later task (§13). When semantic/vector memory is required, use **pgvector** (§18).

## Ownership
The **Memory Manager** (§5) owns these boundaries; other components access memory through it rather than ad hoc stores.
