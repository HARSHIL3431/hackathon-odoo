# RULES.md — AI Agent Execution Rules

## Golden Rules
1. **Patch, don't rewrite.** Never regenerate a whole file to make a small change. Edit only the lines needed.
2. **Checkpoint after every change.** After each feature/file, confirm it runs before moving to the next. Do not stack unverified changes.
3. **One state machine, one place.** All Rental Order transitions go through `lib/rental-logic.ts`. No route or component may mutate `RentalOrder.state` directly.
4. **No scope creep.** If a feature isn't in PRD.md's "Core Features," do not build it, even if it seems easy or "nice to add."
5. **Ask before adding a dependency.** Don't `npm install` new libraries without checking PHASES.md time budget first — check "Libraries to Avoid" below.

## Libraries — Use
- `prisma`, `@prisma/client` (Postgres provider, Neon connection string — see ARCHITECTURE.md)
- `bcryptjs` (password hashing)
- `jsonwebtoken` (auth)
- `tailwindcss`
- `zod` (input validation on API routes)
- `date-fns` (date/late-fee math — avoid moment.js)

## Libraries — Avoid
- NextAuth (config overhead not worth it for JWT-simple auth)
- Redux/Zustand (no need at this scope, React state is enough)
- Any external map/payment SDK (out of scope per PRD)
- ORMs other than Prisma (don't mix raw SQL + ORM)
- UI kits (MUI, Chakra) — Tailwind + hand-rolled components only, faster and no theme conflicts

## Edge Cases to Handle (per feature — don't skip these)

**Booking / Checkout**
- Rental end date before start date → reject
- Requested quantity > available stock → reject with clear message
- Overlapping rental period for same product unit (if tracking individual units)
- Zero/negative rental duration

**Payment / Order Creation**
- Duplicate submit (double-click "Pay Now") → don't create two orders
- Payment step fails/cancelled → order stays in `Draft`, never silently advances to `Paid`

**State Transitions**
- Attempting an illegal transition (e.g. `pickup` before `Paid`) → reject with 409, don't silently allow
- Return attempted on an order still in `Draft`/`Confirmed` → reject
- Settle attempted twice on the same order → reject (already terminal)

**Deposit / Penalty Math**
- Late days calculation where return happens same day but after cutoff time
- Penalty amount exceeds deposit amount → cap refund at ₹0, don't go negative
- Return exactly on due date → counts as on-time, not late (off-by-one check)
- Partial day late (e.g. 2 hours late) → decide and document: rounds up to 1 day, or grace period absorbs it

**Admin Actions**
- Admin tries pickup/return on an order that doesn't exist / wrong ID
- Concurrent admin actions on the same order (last-write-wins is acceptable for hackathon scope, but don't silently corrupt state)

**Auth**
- Duplicate email registration → clear error, not a silent overwrite
- Expired/invalid JWT → redirect to login, not a crash
- Customer trying to hit an admin-only route → 403, not a broken page

Every edge case above that you actually implement should be demoable — pick 2-3 to show live in your demo (e.g. "watch what happens if I try to return late").

## Code Style
- Use TypeScript everywhere, no `.js` files.
- Avoid `any` unless truly unavoidable — prefer `unknown` + narrowing.
- Keep components under ~200 lines where practical; split if larger.
- Separate business logic from UI — no rental math or state transitions inside `.tsx` files.
- Reuse existing components before creating new ones — check `/components` first.

## DATABASE RULE (hard, non-negotiable)
No API route, server action, or UI component may update `RentalOrder` directly.
All `RentalOrder` modifications go through `lib/rental-logic.ts` — the only file allowed to change `RentalOrder.state`.

## Never Rules
- Never update `Product.stockQty` manually outside `rental-logic.ts`.
- Never update `Payment.status` manually outside `rental-logic.ts`.
- Never modify `RentalOrder.state` directly from a route or component.
- Never calculate penalties in an API route — always call `rental-logic.ts`.
- Never duplicate business logic across files.
- Never skip Zod validation on an API route.
- Never call Prisma directly from a component — routes only.
- Never leave mock/hardcoded data in place once real DB integration works.

## Concurrency Rule
Before every state-changing action (pickup, return, settle), re-check the order's current state from the DB immediately before mutating. Reject the request (409) if the state no longer matches what's expected — this prevents double-click / duplicate-request bugs from corrupting state.

## Transaction Rule
Any operation touching multiple tables must use a single `prisma.$transaction`. Example — checkout: create RentalOrder + create Payment + decrement Product stock all commit together or not at all.

## Authorization Rule
Don't scatter role checks. Use two guard functions:
- `requireCustomer()` — for customer-only routes
- `requireAdmin()` — for admin-only routes
Call these at the top of every route handler that needs it.

## Architecture Principle
**RentalOrder is the aggregate root.** All business operations begin and end with RentalOrder — other entities (Product, Payment) never change rental-workflow state independently.

## Error Handling Standard
| Code | Meaning |
|---|---|
| 400 | Validation failure (Zod) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized (wrong role) |
| 404 | Resource not found |
| 409 | Business rule conflict (illegal state transition, duplicate action) |
| 500 | Unexpected error |

Every API route follows: **Validate (Zod) → Authenticate → Authorize → Business Logic (rental-logic.ts) → Prisma → Response.** Never go straight from validation to Prisma.

## AI Agent Boundaries
- Do not modify `prisma/schema.prisma` without explicit instruction — schema changes require a migration and can break existing data.
- Do not touch `lib/rental-logic.ts` (deposit/penalty math) without re-stating the formula back before editing, to avoid silent logic drift.
- Do not "helpfully" add authentication providers, extra roles, or extra product fields not in PRD.md.
- If a request conflicts with PRD.md or ARCHITECTURE.md, flag the conflict instead of silently deciding.
- Always update MEMORY.md after completing a task — this is not optional.
