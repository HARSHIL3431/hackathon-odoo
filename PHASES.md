# PHASES.md — 24-Hour Build Plan

## Strategy Update (per mentor guidance)
Completing the whole project is NOT required. What matters:
1. **Whatever you build must be fully integrated** — real DB writes, real state transitions, real UI reflecting real data. No stubbed buttons that "look done" but don't actually persist/update anything.
2. **Edge cases matter** — a feature that breaks on the second weird input is worse than a smaller feature that's bulletproof.
3. **Stop adding phases once time runs low.** A clean, fully-working online-rental-only demo beats a broken online+in-store+dashboard demo.

**Priority tiers — build in this order, and it's fine to stop after any tier if time runs out:**
- **Tier 1 (must be flawless):** Auth → Catalog → Checkout → Order Created → Pickup → Return → Deposit Settlement (the full online rental lifecycle, one path, zero shortcuts)
- **Tier 2 (only if Tier 1 is fully solid):** Admin Dashboard with real aggregates
- **Tier 3 (only if time remains):** In-store quotation flow
- **Cut first if squeezed:** Pricelist variations, order filters, polish

## Phase 0: Setup (1 hr)
- Next.js + TS + Tailwind + Prisma init
- PostgreSQL (Neon) schema via Prisma — User, Product, RentalOrder, Payment, Pricelist
- Seed script: 3 products, 1 admin user, 2 customer users

## Phase 1: Auth (2 hrs)
- Register/Login (customer)
- JWT cookie session
- Role-based route guard (admin vs customer)

## Phase 2: Customer Catalog + Cart (3 hrs)
- Product list + detail page
- Rental period selector → price calc
- Cart (client state, single product ok, multi-product if time allows)

## Phase 3: Checkout + Order Creation (3 hrs)
- Checkout page (delivery/store toggle)
- Stub payment step
- Order created in `Paid` state, deposit recorded
- Invoice view (simple HTML, no PDF needed unless time allows)

## Phase 4: Admin Dashboard (3 hrs)
- Aggregation queries: active, due today, overdue, revenue, deposits held
- Dashboard widgets (Design.md styling)

## Phase 5: Pickup & Return Flow (4 hrs) — CORE GRADED LOGIC
- Admin order detail page: Pickup button → `Active`
- Return button → inspection form (on-time/late)
- Penalty calculation (`lib/rental-logic.ts`)
- Deposit settlement → `Settled`, show refund breakdown

## Phase 6: In-Store Quotation Flow (2 hrs)
- Admin creates quotation manually for walk-in customer
- Confirm → same state machine from `Confirmed` onward

## Phase 7: Polish + Demo Prep (3 hrs)
- Order list filters (active/overdue/completed)
- Empty states, loading states, basic responsiveness
- Seed realistic demo data (a few overdue orders for dashboard to look alive)
- Write 5-minute demo script covering both flows + state machine explanation

## Phase 8: Buffer (3 hrs)
- Bug fixes, whatever slipped
- **Do not start new features here**

## Time Checkpoints
- Hour 6: Auth + catalog done, or cut Phase 2 scope immediately
- Hour 12: Checkout + order creation working end-to-end
- Hour 18: Pickup/return/deposit logic must be done — this is the graded core
- Hour 21: Feature freeze, polish only

## Definition of Done (applies to every phase)
A phase is complete only if:
- Feature works (happy path).
- DB integrated (real writes, no mock data left behind).
- UI connected (reflects real state, not hardcoded).
- Edge cases handled (see RULES.md → Edge Cases to Handle).
- Types complete, no TypeScript errors.
- Errors handled per RULES.md error code table.
- No build errors.
- TASK.md success criteria checked off.
- MEMORY.md updated.
- Manual test passed (see checklist below).
- Changes committed before starting the next phase.

Do not start the next phase until all of the above are true.

## Manual Testing Checklist (run before marking any phase done)
- ✓ Happy path works
- ✓ Invalid input rejected cleanly
- ✓ Unauthorized access blocked (403/401, not a crash)
- ✓ Duplicate action doesn't corrupt state (double-click test)
- ✓ Database actually updated (check the row, don't just trust the UI)
- ✓ Order state updated correctly
- ✓ UI reflects the updated state on refresh
