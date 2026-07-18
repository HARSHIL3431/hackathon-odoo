# MEMORY.md — Build Progress Log

> Update this after every completed task/checkpoint. Keep entries short — this file is read by the AI agent before every session to avoid re-explaining context.

## Status: IN PROGRESS

## Current Phase
- [x] Phase 0: Setup & Scaffolding
- [x] Phase 1: Authentication & Layout
- [ ] Phase 2: User Dashboard & Catalog (NEXT)
- [ ] Phase 3: Quotation & Checkout
- [ ] Phase 4: Admin Dashboard & Order Management

## Database State
- **Neon PostgreSQL**: Connected successfully via pooled string (`?pgbouncer=true`).
- **Migrations**: `20260718071407_init` applied successfully.
- **Seeding**: DB seeded with admin, customers, and products. Prisma client generated.
- **Prisma Version**: Using Prisma 5 for stability and out-of-the-box support with connection strings.

## Currently Working On
Phase 1 Complete. Waiting for next TASK.md.

## Known Issues / Blockers
(none yet)

## Decisions Made Mid-Build
- **JWT & Route Guards:** Next.js Edge Runtime (middleware.ts) does not support Node.js `crypto` required by `jsonwebtoken`. Consequently, route protection is implemented via utility functions (`requireCustomer`, `requireAdmin`) inside Server Components and API Routes rather than `middleware.ts`.
- **403 Errors in Layouts:** Implemented explicitly thrown and caught `AuthError`s for cleaner status handling across UI layouts.

## Last Updated
2026-07-18
