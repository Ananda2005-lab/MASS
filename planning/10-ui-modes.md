# 10 — UI Modes

Source: Master Project Specification §3, §4.

## Two distinct experiences (locked)
- **Mode A — Instruction:** autonomous natural-language driven. Single input → system decides everything. Purpose-built as a focused instruction surface, not a generic IDE.
- **Mode B — Workspace:** general interactive environment that adapts to the task. Exposes task-relevant surfaces (files, research, results, artifacts, analysis, tools, agent/sub-agent activity, browser work, execution info, task state). It is **NOT a coding IDE** and **NOT a Codex clone** (§3, §20.12).

## Principle (§4)
Both modes use the **same underlying AI core**. The separation is primarily at the user-experience layer. Do not build one IDE-like interface and reuse it for both.

## Visual design
Final premium/modern/polished visual design is **deferred** — do not implement it yet unless explicitly instructed in a later task (§4).

## Current opencode UX
This repository's opencode setup maps the two modes conceptually to subagents (Instruction-style tasks use planning/coding/research agents; Workspace-style tasks use file/browser/analysis/review agents). The actual product UI is a later implementation task.
