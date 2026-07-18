# MEMORY.md — Build Progress Log

> Update this after every completed task/checkpoint. Keep entries short — this file is read by the AI agent before every session to avoid re-explaining context.

## Status: IN PROGRESS

## Current Phase
- [x] Phase 0: Setup & Scaffolding
- [ ] Phase 1: Authentication & Layout (NEXT)
- [ ] Phase 2: User Dashboard & Catalog
- [ ] Phase 3: Quotation & Checkout
- [ ] Phase 4: Admin Dashboard & Order Management

## Database State
- **Neon PostgreSQL**: Connected successfully via pooled string (`?pgbouncer=true`).
- **Migrations**: `20260718071407_init` applied successfully.
- **Seeding**: DB seeded with admin, customers, and products. Prisma client generated.
- **Prisma Version**: Using Prisma 5 for stability and out-of-the-box support with connection strings.

## Currently Working On
(file/feature name — update every session)

## Known Issues / Blockers
(none yet)

## Decisions Made Mid-Build
(log any deviation from ARCHITECTURE.md or PRD.md here, with reason — e.g. "switched X to Y because Z")

## Last Updated
(timestamp)
