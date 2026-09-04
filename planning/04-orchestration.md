# 04 — Orchestration

Source: Master Project Specification §6, §17.

## Responsibility (locked, §6)
The Orchestrator is the **central execution controller**. It dynamically determines:
- task decomposition
- execution plan
- sub-agent selection
- tool selection
- model selection
- execution order
- sequential vs parallel execution
- dependency handling
- verification points
- retry strategy
- recovery strategy
- fixing strategy
- re-planning

## Control model (§6)
Sub-agents must **NOT** operate as uncontrolled independent agents. They are created, selected, delegated to, monitored, and evaluated **through the orchestration system**.

## Parallel execution (§17)
The architecture must support parallel execution of independent tasks (e.g., Research + Analysis + File inspection) when dependencies allow, then combine results. Do not introduce parallelism where dependencies make it unsafe.

## Interaction with other components
- Consults the Planner for decomposition.
- Uses the Sub-Agent Manager to spawn/monitor sub-agents.
- Uses the Tool Manager for tool access (permission-gated).
- Uses the LLM Gateway for model selection.
- Feeds the Verifier at verification points.

## Deferred
Concrete algorithms for routing, scheduling, and re-planning are specified in later tasks (not in this planning phase).
