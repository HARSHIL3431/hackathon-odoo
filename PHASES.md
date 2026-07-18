# PHASES.md — 24-Hour Build Plan

## Strategy Update (hackathon requirement: three real portals)
Completing every feature is NOT required, but **all three portals — Customer, Vendor, Admin — must exist and be real**, per confirmed hackathon requirement. What matters:
1. **Whatever you build must be fully integrated** — real DB writes, real state transitions, real UI reflecting real data. No stubbed buttons that "look done" but don't actually persist/update anything.
2. **Edge cases matter** — a feature that breaks on the second weird input is worse than a smaller feature that's bulletproof.
3. **Admin portal cannot be skipped or left as a placeholder** — it needs at minimum: user list, vendor list, pricelist CRUD, all DB-backed.

**Priority tiers — build in this order:**
- **Tier 1 (must be flawless):** Auth → Catalog → Checkout → Order Created → Pickup → Return → Deposit Settlement (Customer + Vendor portals, full lifecycle, zero shortcuts)
- **Tier 2 (required, not optional):** Admin portal — user list, vendor list, pricelist CRUD
- **Tier 3 (only if time remains):** In-store quotation flow, order filters, polish
- **Cut first if squeezed:** Pricelist variations beyond 1 custom list, polish/animations, empty-state niceties

## Phase 0: Setup (1 hr)
- Next.js + TS + Tailwind + Prisma init
- PostgreSQL (Neon) schema via Prisma — User, Product, RentalOrder, Payment, Pricelist
- Seed script: 3 products, 1 admin, 1 vendor, 2 customer users

## Phase 1: Auth (2 hrs)
- Register/Login (customer)
- JWT cookie session
- Role-based route guards: `requireCustomer()`, `requireVendor()`, `requireAdmin()`

## Phase 2: Customer Catalog + Cart (3 hrs)
- Product list + detail page
- Rental period selector → price calc
- Cart (client state, single product ok, multi-product if time allows)

## Phase 3: Checkout + Order Creation (3 hrs)
- Checkout page (delivery/store toggle)
- Stub payment step
- Order created in `Paid` state, deposit recorded
- Invoice view (simple HTML, no PDF needed unless time allows)

## Phase 4: Vendor Dashboard (3 hrs)
- Add `VENDOR` to Role enum, migrate schema
- Aggregation queries: active, due today, overdue, revenue, deposits held
- Dashboard widgets (Design.md styling), order list with filters
- Product CRUD moves here — Vendor owns products/inventory, not Admin

## Phase 5: Pickup & Return Flow (4 hrs) — CORE GRADED LOGIC
- Vendor order detail page: Pickup button → `Active`
- Return button → inspection form (on-time/late)
- Penalty calculation (`lib/rental-logic.ts`)
- Deposit settlement → `Settled`, show refund breakdown

## Phase 6: Admin Portal (2–3 hrs) — REQUIRED, not optional
- User list (all customers + vendors, with role shown)
- Vendor list/approval view
- Pricelist CRUD (default + at least 1 custom)
- Simple settings form (late fee defaults, grace period) — doesn't need deep configurability

## Phase 7: In-Store Quotation Flow (2 hrs) — Tier 3, cut first if squeezed
- Vendor creates quotation manually for walk-in customer
- Confirm → same state machine from `Confirmed` onward

## Phase 8: Polish + Demo Prep (2–3 hrs)
- Order list filters (active/overdue/completed)
- Empty states, loading states, basic responsiveness
- Seed realistic demo data (a few overdue orders for dashboard to look alive)
- Write a demo script covering all three portals + state machine explanation

## Phase 9: Buffer
- Bug fixes, whatever slipped
- **Do not start new features here**

## Time Checkpoints
- Hour 6: Auth + catalog done, or cut Phase 2 scope immediately
- Hour 12: Checkout + order creation working end-to-end
- Hour 16: Vendor dashboard + pickup/return/deposit logic done — this is the graded core
- Hour 19: Admin portal done (user list, vendor list, pricelist CRUD) — required, don't skip
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
