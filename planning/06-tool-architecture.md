# 06 — Tool Architecture

Source: Master Project Specification §11.

## Principle (locked)
Tools are **modular**. Do NOT implement every tool now (§11, §21). First establish the architecture/interface required for them.

## Initial tool categories (§11)
- Web
- Search
- Files
- Code
- Terminal
- Browser
- Calculator
- Custom Tools

## Controlled interface (every tool eventually has, §11)
- name
- description
- input schema
- output schema
- permissions
- execution mechanism
- error handling

## Control flow
Tools are reached by agents **only through the Tool Manager**, which enforces permission/approval gates (§19). No agent invokes a host tool directly bypassing the manager.

## Deferred
Concrete tool implementations and the permission registry are specified in later tasks. Do not add unspecified tools in this phase (§20.5).
