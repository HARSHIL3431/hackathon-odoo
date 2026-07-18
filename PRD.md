# PRD.md — Rental Management System

## Tech Stack Summary
| Layer | Choice |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Authentication | JWT + bcryptjs |
| Validation | Zod |
| Date Handling | date-fns |

## 1. What We're Building
A web-based Rental ERP where customers browse and rent products online (or via in-store quotation), and an Admin manages the full rental lifecycle — quotation → payment → pickup → return → deposit settlement — from one dashboard.

Single deliverable, single repo, solo build, 24-hour hackathon.

## 2. Targeted Users
- **Customer**: browses products, rents online, pays deposit, tracks orders, returns product in-store.
- **Admin**: only backend role. Creates products/pricelists, handles in-store quotations, manages pickup/return, settles deposits, views dashboard.

No separate "Vendor" role — Admin covers all backend responsibilities per the original PRD.

## 3. Core Features (MUST BUILD)

### Customer side
- Register / Login
- Browse products (list + detail page)
- Select rental period, add to cart
- Checkout: delivery or store pickup, pay (stub payment ok)
- View invoice after payment
- View "My Orders" with status
- Return flow trigger (mark "returned" — actual inspection done by Admin)

### Admin side
- Login (separate role flag, same auth table)
- Dashboard: active rentals, due today, overdue, revenue, deposits held, late fees collected
- Product CRUD (name, rental price, deposit amount, late fee/day, stock qty)
- Pricelist (at least: default + 1 custom pricelist)
- In-store quotation creation → confirm → invoice (offline flow)
- Pickup confirmation (mark order as picked up/active)
- Return processing: on-time → full deposit refund; late → penalty calc → partial refund
- Order list with filters (active, overdue, completed)

## 4. Business Rules (must be correct, this is what's graded)
- Deposit collected at payment time.
- On-time return → 100% deposit refund.
- Late return → penalty = late fee/day × days late (cap at deposit amount) → refund = deposit − penalty.
- Order state machine (see ARCHITECTURE.md) must be enforced — no skipping states.

## 5. Explicitly Out of Scope (do not build)
- Barcode/QR scanning
- IoT tracking
- Route optimization
- Predictive maintenance
- Generic attribute/variant engine (hardcode 1–2 variant types max, e.g. color)
- Real payment gateway (stub only)
- Vendor role
- Multi-currency / multi-company

## 6. Success Criteria
- **Completing the entire feature list is NOT required.** Whatever is built must be fully integrated (real data, real state transitions) — no stubbed features that only look done.
- At minimum, the full online rental lifecycle (browse → pay → pickup → return → deposit settlement) works end-to-end with zero shortcuts.
- Key edge cases are handled and demoable (see RULES.md → Edge Cases to Handle), not just the happy path.
- Deposit/late-fee math is correct.
- You can verbally explain every state transition and why it exists.

## 7. Future Enhancements (post-hackathon, not for 24hr build)
- QR code pickup/return scanning
- Razorpay (or real gateway) integration
- Email/SMS notifications for due/overdue rentals
- Full product variant/attribute engine
- AI-based demand forecasting
- Inventory prediction & auto-reorder suggestions
