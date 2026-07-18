# MEMORY.md — Build Progress Log

> Update this after every completed task/checkpoint. Keep entries short — this file is read by the AI agent before every session to avoid re-explaining context.

## Status: IN PROGRESS

## Current Phase
- [x] Phase 0: Setup
- [x] Phase 1: Authentication
- [x] Phase 2: Customer Catalog + Cart
- [x] Phase 3: Checkout + Order Creation (with fixes)
- [x] Phase 4: Vendor Dashboard + Permission Matrix Refactor
- [x] Phase 5: Pickup & Return Flow (Core Graded Logic)
- [ ] Phase 6: Admin Portal
- [ ] Phase 7: In-Store Quotation Flow
- [ ] Phase 8: Polish + Demo Prep

## Database State
- **Neon PostgreSQL**: Connected successfully via pooled string.
- **Migrations**: `20260718071407_init` applied, VENDOR role added via `prisma db push`.
- **Seeding**: DB seeded with admin, vendor (`vendor@rental.com`), customers, and products. All password: `password123`.
- **Prisma Version**: Prisma 5.22.0.

## Users (for testing)
| Email | Password | Role |
|-------|----------|------|
| admin@rental.com | password123 | ADMIN |
| vendor@rental.com | password123 | VENDOR |
| customer1@example.com | password123 | CUSTOMER |
| customer2@example.com | password123 | CUSTOMER |

## Known Issues / Deviations
- **Quantity Unrolling**: `RentalOrder` has no `quantity` column. Cart qty N creates N distinct `RentalOrder + Payment` rows within a single transaction. Aligns with strict single-asset state machine tracking.
- **Neon Transaction Timeout**: Interactive transactions require 30s timeout (`{ timeout: 30000 }`) due to Neon serverless HTTP latency. Default 5000ms causes timeouts.
- **Idempotency Guard**: Uses recent-duplicate-query approach (same customer, same products, Paid state, within 30s window). Has a theoretical race window under true concurrent requests — accepted as "good enough for hackathon scope." A fully race-proof solution would use a unique constraint on a hash column or distributed lock.
- **stockQty: 9999 Bypass**: In `rental-logic.ts`, `calculateRentalPrice()` receives `stockQty: 9999` to bypass the internal stock check. Stock is already validated earlier in the same transaction (lines 75-77), so this is intentional and safe. Comment added.
- **db push instead of migrate**: Neon direct connection was timing out, so `prisma db push` was used instead of `prisma migrate dev` for the VENDOR role addition.

## Files Changed This Session

### Part A — Phase 3 Fixes
- `lib/rental-logic.ts` — Added idempotency guard (recent duplicate query, 30s window); added stockQty: 9999 bypass comment
- `app/api/orders/route.ts` — Differentiated error codes (400 for Zod validation, 409 for business rule conflicts, 500 for unexpected); increased transaction timeout to 30s; updated to use `requireCustomerAccess()`
- `test-checkout.ts` — Fixed Prisma transaction timeout (30s), fixed order isolation test
- `test-idempotency.ts` — New test file verifying double-click prevention

### Part B — Auth Guard Refactor
- `prisma/schema.prisma` — Added `VENDOR` to `Role` enum; added `directUrl` for Neon
- `prisma/seed.ts` — Added vendor user (`vendor@rental.com`)
- `lib/auth.ts` — Replaced `requireCustomer()` and `requireAdmin()` with:
  - `requireCustomerAccess()` — CUSTOMER or ADMIN
  - `requireVendorAccess()` — VENDOR or ADMIN
  - `requireAdminOnly()` — ADMIN only
- Updated call sites: `app/api/orders/route.ts`, `app/api/products/route.ts`, `app/checkout/page.tsx`, `app/orders/page.tsx`, `app/orders/[id]/page.tsx`, `app/admin/dashboard/page.tsx`, `app/layout.tsx`

### Part C — Vendor Dashboard (Phase 4)
- `components/DashboardWidget.tsx` — Reusable dashboard card (label + value + color)
- `app/api/dashboard/route.ts` — GET endpoint with `requireVendorAccess()`, returns 6 aggregate metrics
- `app/vendor/dashboard/page.tsx` — Server component with direct Prisma queries for performance, 6 widgets
- `app/vendor/orders/page.tsx` — Order list with filter tabs (All/Active/Overdue/Completed), table with View link
- `app/api/products/[id]/route.ts` — DELETE endpoint with `requireAdminOnly()` guard
- `app/api/products/route.ts` — Changed POST guard from `requireAdmin()` to `requireVendorAccess()`; added Zod validation
- `app/layout.tsx` — Added Vendor Dashboard nav link for VENDOR/ADMIN roles; updated My Orders link

### Part D — Phase 5: Pickup & Return Flow
- `lib/rental-logic.ts` — Implemented `processTransition` with pickup, return, settle logic, strict date math, and concurrency guards.
- `app/api/orders/[id]/transition/route.ts` — Exposes transition POST endpoint protected by `requireVendorAccess`.
- `app/vendor/orders/[id]/page.tsx` — Vendor order detail view with conditional transition buttons.
- `app/vendor/orders/[id]/TransitionButtons.tsx` — Client component handling UI state for transitions.
- `test-phase5.ts` — Test script verifying edge cases for math and illegal state transitions.
- `.env` — Switched DATABASE_URL to DIRECT_URL to resolve Neon serverless pooler timeouts.

## Currently Working On
Phase 5 complete. Awaiting approval to begin Phase 6 (Admin Portal).

## Build Status
- 0 TypeScript errors
- 0 build errors
- 19 routes compiled successfully

## Last Updated
2026-07-18
