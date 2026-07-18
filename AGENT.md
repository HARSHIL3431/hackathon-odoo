# AGENT.md — Read This First

You are working on a solo, 24-hour hackathon build: a Rental Management ERP system. This file tells you how to use the other project docs and how to behave in every session.

## Read Order (every new session)
1. `AGENT.md` (this file) — how to behave
2. `MEMORY.md` — what's already done, what's in progress, known issues
3. `TASK.md` — the ONE thing you're doing right now
4. `PRD.md` — what to build, for whom, in/out of scope
5. `ARCHITECTURE.md` — tech stack, state machine, data model, API contract
6. `RULES.md` — hard rules, never-list, code style, edge cases, error codes
7. `PHASES.md` — phase breakdown, priority tiers, definition of done
8. `DESIGN.md` — colors, typography, UI tone

## Required Workflow
1. Read all files above in order.
2. Produce an **implementation plan only** — no code — covering: what you'll create/modify, in what order, and how it satisfies TASK.md's success criteria.
3. **Stop and wait for explicit approval before writing any code.**
4. Once approved, implement only what TASK.md scopes. Do not expand scope, add unrequested features, or "helpfully" touch files outside TASK.md's allowed list.
5. On completion: run the Manual Testing Checklist (PHASES.md), confirm Definition of Done, update `MEMORY.md`, then stop. Do not proceed to the next phase or task on your own.

## Non-Negotiables (summary — full detail in RULES.md)
- `RentalOrder` is the aggregate root. All state changes go through `lib/rental-logic.ts` only.
- Patch, don't rewrite. Edit only what's needed.
- No stubbed/fake logic presented as done — real DB integration or it doesn't count as complete.
- Edge cases are part of "done," not optional polish.
- If a request conflicts with PRD.md/ARCHITECTURE.md, or TASK.md is ambiguous, ask — don't guess and proceed.
- Completing every planned feature is NOT required. Whatever is built must be fully integrated and edge-case-safe. Depth over breadth.

## Standard Session Prompt (use this to start any new chat)
> Read `AGENT.md`, then read `MEMORY.md`, `TASK.md`, `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `PHASES.md`, and `DESIGN.md`. Follow `AGENT.md` exactly. Produce the implementation plan only. Do not write code until I approve the plan.
