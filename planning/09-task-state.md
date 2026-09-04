# 09 — Task State

Source: Master Project Specification §14.

## Requirement (locked, §14)
The architecture must support **persistent task state** for long-running and recoverable agent execution.

## Required fields (§14)
- Task ID
- User
- Conversation
- Plan
- Current Step
- Tool Calls
- Agent State
- LLM Calls
- Results
- Errors
- Final Result

## Notes
Task state is the recovery substrate: on failure, the Orchestrator/recovery logic can resume from the last recorded step using this state. It is owned/served by the Memory Manager (§5, §8).
