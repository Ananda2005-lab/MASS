# MASTER PROJECT SPECIFICATION — AI AGENT PLATFORM

## 1. YOUR ROLE

You are the implementation engineer for this project.

You are NOT the architect.

The architecture, product direction, major technology choices, agent philosophy, orchestration strategy, and UI concept are already defined.

Your responsibility is to implement the specification exactly as provided.

Do not invent architecture.
Do not redesign the system.
Do not replace technologies.
Do not add features that are not specified.
Do not make assumptions about missing requirements.

If something is genuinely ambiguous or contradictory, STOP and report the exact ambiguity before implementing that part.

---

# 2. PROJECT GOAL

We are building a general-purpose AI Agent Platform.

This is NOT a simple chatbot.

The system must be capable of receiving arbitrary user tasks and using an intelligent agent runtime, orchestration, specialized sub-agents, tools, multiple LLM providers/models, memory, verification, and recovery mechanisms to complete those tasks.

The fundamental execution flow is:

USER REQUEST
→ UNDERSTAND
→ CHECK CONTEXT/MEMORY
→ CLASSIFY TASK
→ PLAN
→ ORCHESTRATE
→ SELECT MODELS/TOOLS/SUB-AGENTS
→ EXECUTE
→ OBSERVE
→ VERIFY
→ FIX/RETRY/RE-PLAN WHEN REQUIRED
→ VERIFY AGAIN
→ FINAL RESULT

The system must be designed as a modular platform so that additional capabilities can be added later without rewriting the core architecture.

---

# 3. TWO USER MODES

The product has TWO distinct top-level user experiences.

## MODE A — INSTRUCTION

This mode is inspired by the provided reference concept.

The user gives a natural-language instruction such as:

"Research this topic."

"Analyze these files."

"Build this."

"Fix this problem."

"Do this task for me."

The user should not need to manually construct the workflow.

The Main Agent and Orchestrator should determine the appropriate:

- plan
- sub-agents
- tools
- models
- execution order
- verification strategy
- recovery strategy

unless the user explicitly specifies constraints or choices.

This is the autonomous agent experience.

---

## MODE B — WORKSPACE

Workspace is NOT a coding IDE.

Workspace is NOT a Codex clone.

Workspace is a general interactive environment where the user can work with the AI agent on different types of tasks.

Depending on the task, the workspace may expose:

- files
- research
- results
- generated artifacts
- analysis
- tools
- agent activity
- sub-agent activity
- browser work
- execution information
- task state
- other relevant information

The workspace must adapt to the task instead of being designed exclusively around programming.

---

# 4. UI PRINCIPLE

Instruction and Workspace must have DIFFERENT purpose-built UI experiences.

Do not simply create one IDE-like interface and reuse it for both.

Both modes use the SAME underlying AI core.

The separation is primarily at the user-experience layer.

Conceptually:

USER
→ Instruction OR Workspace
→ API/Session Layer
→ Agent Runtime
→ Orchestrator
→ Sub-Agents / Tools
→ LLM Gateway
→ Models
→ Memory/State
→ Infrastructure

The UI should eventually feel premium, modern, highly polished, responsive, and at least comparable to the provided reference video in perceived quality.

Do not implement the final visual design yet unless explicitly instructed in a later task.

---

# 5. CORE AGENT ARCHITECTURE

The Agent Runtime contains:

- Main Agent
- Planner
- Orchestrator
- Executor
- Verifier
- Sub-Agent Manager
- Tool Manager
- Memory Manager

The Main Agent is general-purpose.

The Orchestrator is the central execution controller.

---

# 6. ORCHESTRATOR RESPONSIBILITY

The Orchestrator is responsible for dynamically determining:

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

Sub-agents must NOT operate as uncontrolled independent agents.

Sub-agents are created, selected, delegated to, monitored, and evaluated through the orchestration system.

---

# 7. SPECIALIZED SUB-AGENTS

The architecture must support specialized agents for different kinds of work.

Initial conceptual roles include:

- Research Agent
- Deep Reading / Understanding Agent
- Analysis Agent
- Planning Agent
- Coding Agent
- Writing Agent
- Debug Agent
- Fix Agent
- Review Agent
- Testing Agent
- Browser Agent
- File Agent
- Verification Agent
- Security / Permission Agent

This is an initial capability model, not permission to arbitrarily create additional agents.

The exact implementation of each sub-agent will be specified in later implementation tasks.

---

# 8. SUB-AGENT QUALITY REQUIREMENT

Sub-agents must perform intelligent contextual work.

A Reader is NOT merely:

"read file and return text."

A Reader must be capable of contextual understanding appropriate to its assigned task.

A Writer is NOT merely:

"write some text."

It must understand the relevant context, inspect required information, perform the assigned work, and validate its result.

The same principle applies to Debug, Fix, Research, Analysis, Testing, Review, and other specialized agents.

---

# 9. AUTONOMOUS + USER-GUIDED OPERATION

The system must support both:

## Autonomous orchestration

The user provides a goal and the system determines the execution strategy.

## User-guided orchestration

The user may explicitly specify things such as:

- use a particular sub-agent
- use a particular model
- use a particular tool
- follow a particular order
- perform a particular step first
- avoid a particular capability

The Orchestrator must incorporate valid user instructions into execution.

User guidance does not remove system security and permission constraints.

---

# 10. LLM GATEWAY

Agents must NOT directly depend on individual LLM providers.

Create a dedicated LLM Gateway / Router abstraction.

Conceptual flow:

Agent
→ LLM Gateway
→ Router
→ Eligible Provider / Model / Credential Profile
→ LLM
→ Response
→ Agent

The gateway must eventually support:

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

Multiple legitimately available provider credentials/profiles may be configured.

The system must respect provider terms, quotas, rate limits, and usage restrictions.

Do not implement mechanisms intended to bypass provider restrictions.

The detailed routing algorithm will be specified separately.

---

# 11. TOOL ARCHITECTURE

Tools must be modular.

Initial tool categories:

- Web
- Search
- Files
- Code
- Terminal
- Browser
- Calculator
- Custom Tools

Every tool should eventually have a controlled interface containing concepts such as:

- name
- description
- input schema
- output schema
- permissions
- execution mechanism
- error handling

Do NOT implement every tool now unless explicitly instructed.

First establish the architecture/interface required for them.

---

# 12. FUTURE DEVICE CONTROL

Android / ADB / multi-device control is a FUTURE capability.

Do NOT implement it in the initial phase.

The architecture must nevertheless allow a future Device Tool / Device Manager to be added without rewriting the Agent Runtime or Orchestrator.

Potential future structure:

Agent
→ Orchestrator
→ Tool Manager
→ Device Tool
→ Device Manager
→ Phone 1 / Phone 2 / Phone 3 / ...

---

# 13. MEMORY AND CONTEXT

Create architectural boundaries for:

- conversation context
- task state
- previous results
- important memory
- tool results
- agent state

The system must eventually support:

- context management
- context compression
- summarization
- relevant context retrieval

Do not implement an unnecessarily complex memory system unless explicitly specified in a later task.

---

# 14. TASK STATE

The architecture must support persistent task state containing concepts such as:

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

This is necessary for long-running and recoverable agent execution.

---

# 15. VERIFICATION AND QUALITY

The agent must not blindly accept every generated result.

The architecture must support:

Generate
→ Verify
→ Correct?

If correct:
→ Final

If incorrect:
→ Diagnose
→ Retry / Fix / Re-plan
→ Verify again

The exact verification strategies will be implemented later.

---

# 16. ERROR RECOVERY

The system must be designed for failure.

Relevant failures include:

- LLM errors
- rate limits
- provider failures
- model failures
- tool failures
- invalid tool results
- incorrect output
- code failures
- sub-agent failures
- planning failures

Potential recovery mechanisms:

- retry
- fallback
- diagnose
- fix
- re-plan
- verify

Do not implement arbitrary recovery behavior that has not been specified.

---

# 17. PARALLEL EXECUTION

The architecture must support parallel execution for independent tasks.

Example:

Main Task
→ Research
→ Analysis
→ File inspection

These can execute independently when dependencies allow.

Their results can then be combined.

Do not introduce parallel execution where task dependencies make it unsafe.

---

# 18. TECHNOLOGY STACK

Use the following technology choices unless a later explicit instruction changes them.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- Framer Motion

## Backend

- Python
- FastAPI
- asyncio

## AI Core

- Custom Agent Runtime
- Custom Orchestrator
- Custom LLM Gateway / Router

Do NOT make the core architecture dependent on a single external agent framework.

## Data

- PostgreSQL
- Redis
- pgvector when semantic/vector memory is required

## Browser

- Playwright

## Real-time

- WebSocket and/or SSE where appropriate

## Security

- permission layer
- API-key protection
- sandboxing
- command restrictions
- user approval
- rate limiting
- audit logs

## Testing

Support:

- unit tests
- integration tests
- agent tests
- tool tests
- LLM router tests
- API tests
- UI tests
- end-to-end tests

---

# 19. SECURITY PRINCIPLES

Security must be considered from the beginning.

Do not expose provider API keys to the frontend.

Do not provide unrestricted host-machine access to agents.

Tools must eventually pass through permission controls.

Code execution must eventually be sandboxed.

Potentially destructive operations must have appropriate permission/approval mechanisms.

---

# 20. DEVELOPMENT RULES

These rules are STRICT.

1. Do not guess missing requirements.
2. Do not redesign the architecture.
3. Do not replace the selected technology stack.
4. Do not introduce an alternative architecture.
5. Do not add unspecified features.
6. Do not modify unrelated files.
7. Do not create duplicate systems for the same responsibility.
8. Do not bypass the defined abstraction layers.
9. Do not expose secrets.
10. Do not silently change locked decisions.
11. Do not implement future mobile control now.
12. Do not turn Workspace into a coding-only IDE.
13. Do not treat Instruction mode as a simple chatbot.
14. Do not make sub-agents uncontrolled independent agents.
15. Do not use an external agent framework as the core architecture unless explicitly approved later.

If a requirement is genuinely ambiguous, STOP and report it.

---

# 21. CURRENT TASK — PLANNING FOUNDATION ONLY

IMPORTANT:

For THIS task, do NOT build the complete application.

Do NOT implement the complete Agent Runtime.

Do NOT implement all sub-agents.

Do NOT implement the complete LLM router.

Do NOT implement mobile control.

Do NOT implement every tool.

Do NOT start adding random UI features.

Your current responsibility is to establish the project's planning/specification foundation.

---

# 22. FIRST TASK

First inspect the existing project directory and determine:

- whether a project already exists
- current framework
- current files
- existing configuration
- existing dependencies
- existing source structure
- existing scripts
- whether anything already implemented can be reused

Do not delete or rewrite existing work.

Then create a clear project specification structure for the system described above.

The planning documents should clearly separate:

1. Product requirements
2. Architecture
3. Agent Runtime
4. Orchestration
5. Sub-Agent architecture
6. Tool architecture
7. LLM Gateway
8. Memory/Context
9. Task State
10. UI modes
11. Security
12. Data architecture
13. Testing strategy
14. Future extensions

Use the existing project conventions where appropriate.

---

# 23. IMPORTANT: DO NOT START IMPLEMENTATION

At the end of this task, the project should have a clean, understandable planning/specification foundation.

Do not proceed automatically into implementation.

Do not decide unspecified technical details yourself.

If a specific implementation decision is required to create the planning documents and it is not defined above, report it instead of inventing a solution.

---

# 24. COMPLETION CONDITION

This task is complete only when:

- Existing project structure has been inspected.
- No existing work has been unnecessarily destroyed.
- The locked architecture has been documented.
- Instruction and Workspace are clearly documented as separate experiences.
- Agent Runtime responsibilities are documented.
- Orchestrator responsibilities are documented.
- Specialized sub-agent architecture is documented.
- Tool architecture is documented.
- LLM Gateway architecture is documented.
- Memory/context architecture is documented.
- Task-state architecture is documented.
- Verification/recovery principles are documented.
- Security principles are documented.
- Technology stack is documented.
- Future mobile/device control is explicitly marked as future scope.
- No full application implementation has been started.
- Any genuine ambiguity is reported instead of guessed.

After completing this planning task, STOP and report exactly what was created and any decisions that still require explicit approval.

Do not continue to another implementation task automatically.