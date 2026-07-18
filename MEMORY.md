# MEMORY.md — Build Progress Log

> Update this after every completed task/checkpoint. Keep entries short — this file is read by the AI agent before every session to avoid re-explaining context.

## Status: IN PROGRESS

## Current Phase
- [x] Phase 0: Setup
- [x] Phase 1: Authentication
- [x] Phase 2: Customer Catalog + Cart
- [x] Phase 3: Checkout + Order Creation
- [ ] Phase 4: Admin Dashboard
- [ ] Phase 5: Pickup & Return Flow (Core Graded Logic)
- [ ] Phase 6: In-Store Quotation Flow
- [ ] Phase 7: Polish + Demo Prep

## Database State
- **Neon PostgreSQL**: Connected successfully via pooled string (`?pgbouncer=true`).
- **Migrations**: `20260718071407_init` applied successfully.
- **Seeding**: DB seeded with admin, customers, and products. Prisma client generated.
- **Prisma Version**: Using Prisma 5 for stability and out-of-the-box support with connection strings.

## Known Issues / Deviations
- **Next 15 Async Params**: Replaced synchronous `params` destruction with `await params` in dynamic routes to prevent crashes under Next 15 Edge Runtime.
- **Quantity Unrolling**: Because `RentalOrder` does not have a `quantity` column, Phase 3 unrolls checkout items. A cart item with quantity 3 creates 3 distinct `RentalOrder` rows (and 3 `Payment` rows) within a single transaction. This satisfies the schema without modification and aligns perfectly with strict single-asset state machine tracking (like Odoo stock quants).

## Currently Working On
Phase 3 complete. Awaiting approval to begin Phase 4.

## Phase 3 Completion Notes
- Previous session left 4 critical bugs (CheckoutForm used `cart` instead of `items`, CartSummary missing `Link` import, no Zod on API, no nav link). All fixed.
- DB verification: stock decrement PASS, order creation PASS, FK relations PASS, payment records PASS, order isolation PASS.
- Build: zero TypeScript errors, zero build errors, all 15 routes compile.

## Known Issues / Blockers
(none)

## Decisions Made Mid-Build
- **JWT & Route Guards:** Next.js Edge Runtime (middleware.ts) does not support Node.js `crypto` required by `jsonwebtoken`. Consequently, route protection is implemented via utility functions (`requireCustomer`, `requireAdmin`) inside Server Components and API Routes rather than `middleware.ts`.
- **403 Errors in Layouts:** Implemented explicitly thrown and caught `AuthError`s for cleaner status handling across UI layouts.

## Last Updated
2026-07-18
