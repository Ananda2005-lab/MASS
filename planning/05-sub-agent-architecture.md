# 05 — Sub-Agent Architecture

Source: Master Project Specification §7, §8.

## Initial capability model (locked, §7)
Specialized agents the architecture must support:
1. Research Agent
2. Deep Reading / Understanding Agent
3. Analysis Agent
4. Planning Agent
5. Coding Agent
6. Writing Agent
7. Debug Agent
8. Fix Agent
9. Review Agent
10. Testing Agent
11. Browser Agent
12. File Agent
13. Verification Agent
14. Security / Permission Agent

This is an **initial capability model**, not permission to arbitrarily create additional agents (§7). Per-sub-agent implementation is specified in later tasks.

## Quality requirement (§8)
Sub-agents perform intelligent contextual work. They must understand relevant context, inspect required information, perform the assigned work, and validate their result — not merely return raw text or write naive text.

## Control (§6, §20.14)
Sub-agents are created/selected/delegated/monitored/evaluated via the Sub-Agent Manager and Orchestrator. They are not uncontrolled independent agents.

## Current opencode setup (this repo)
13 subagents are already registered under `.opencode/agent/` mirroring the roles above:
research-agent, analysis-agent, planning-agent, coding-agent, writing-agent, debug-agent, fix-agent, review-agent, testing-agent, browser-agent, file-agent, verification-agent, security-agent.
These are planning/assistance subagents for the project; they are not the platform's runtime sub-agents (which are deferred to implementation tasks).
