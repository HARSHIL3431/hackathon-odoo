# TASK.md — Current Task

Before writing code:

- Read PRD.md
- Read ARCHITECTURE.md
- Read RULES.md
- Read MEMORY.md

Then execute only the current task.

> Overwrite this file before every session with ONE specific task. Give the AI agent "Complete TASK.md" instead of open-ended instructions.

## Current Task

**Goal:**
(e.g. Implement Phase 0 completely)

**Files allowed to modify:**
- (e.g. `prisma/`, `app/`, `lib/`, `package.json`)

**Files NOT to touch:**
- (anything not listed above — be explicit if a file is sensitive, e.g. `lib/rental-logic.ts`)

**Success Criteria:**
- (e.g. App runs with no errors)
- (e.g. Prisma migration successful against Neon)
- (e.g. Seed data created)
- (e.g. Login page renders and auth works)

**After completion:**
- Update MEMORY.md (mark phase complete, note current file, log any deviations).
- Stop and wait for the next TASK.md — do not continue to the next phase unprompted.

---

## Example (Phase 0)

**Goal:** Implement Phase 0 completely.

**Files allowed to modify:** `prisma/`, `app/`, `lib/`, `package.json`

**Files NOT to touch:** none yet exist beyond scaffolding

**Success Criteria:**
- App runs (`npm run dev`) with no errors.
- Prisma migration successful against Neon Postgres.
- Seed script creates 3 products, 1 admin, 2 customers.
- Login page renders (functionality comes in Phase 1).

**After completion:** Update MEMORY.md. Stop and wait for next instruction.
