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
This hackathon requires three separate portals — Customer, Vendor, and Admin — each a real, working deliverable, not a placeholder. **See RULES.md → Permission Matrix for the authoritative access table.**

- **Customer**: browses products, rents online, pays deposit, tracks orders, returns product in-store.
- **Vendor**: day-to-day operations — product creation (not deletion), in-store quotations, vendor dashboard, pickup/return processing, deposit settlement. No access to Cart/Checkout (Vendor doesn't shop), no access to Reports/Settings/User Management (Admin-only).
- **Admin**: superset role — has all Vendor and Customer access PLUS admin-only features: Admin Dashboard, Delete Product, Manage Users, Reports, Settings.

**Note on this change**: earlier in planning, a 3-role RBAC system was drafted and rejected as unrequested scope creep. This time it's a confirmed hackathon requirement — three portals are mandatory, with Admin as a superset role — so it's adopted deliberately. Logged here so future sessions use the current, correct role split.

## 3. Core Features (MUST BUILD)

### Customer Portal
- Register / Login
- Browse products (list + detail page)
- Select rental period, add to cart
- Checkout: delivery or store pickup, pay (stub payment ok)
- View invoice after payment
- View "My Orders" with status
- Return flow trigger (mark "returned" — actual inspection done by Vendor)

### Vendor Portal (day-to-day operations)
- Login (VENDOR role)
- Dashboard: active rentals, due today, overdue, revenue, deposits held, late fees collected
- Product Create (name, rental price, deposit amount, late fee/day, stock qty) — Vendor can create/edit, cannot delete
- In-store quotation creation → confirm → invoice (offline flow)
- Pickup confirmation (mark order as picked up/active)
- Return processing: on-time → full deposit refund; late → penalty calc → partial refund
- Order list with filters (active, overdue, completed)

### Admin Portal (superset role — has all Vendor + Customer access, plus admin-only features)
- Login (ADMIN role)
- Admin Dashboard (admin-only view, separate from Vendor Dashboard)
- Delete Product (Admin-only — Vendor cannot delete)
- User management: list all users (customers + vendors), view roles
- Vendor management: list/approve vendor accounts
- Pricelist management: at least default + 1 custom pricelist, CRUD
- Reports (Admin-only)
- Company/rental settings: late fee defaults, grace period — can be a simple settings form

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
- Multi-currency / multi-company

## 6. Success Criteria
- **Completing the entire feature list is NOT required, but all three portals must exist and be real** — no stubbed features that only look done, per hackathon requirement.
- At minimum, the full online rental lifecycle (browse → pay → pickup → return → deposit settlement) works end-to-end with zero shortcuts, spanning Customer and Vendor portals.
- Admin portal exists with at least user list, vendor list, and pricelist CRUD — real DB-backed, not mock data.
- Key edge cases are handled and demoable (see RULES.md → Edge Cases to Handle), not just the happy path.
- Deposit/late-fee math is correct.
- You can verbally explain every state transition, every role's boundary, and why each exists.

## 7. Future Enhancements (post-hackathon, not for 24hr build)
- QR code pickup/return scanning
- Razorpay (or real gateway) integration
- Email/SMS notifications for due/overdue rentals
- Full product variant/attribute engine
- AI-based demand forecasting
- Inventory prediction & auto-reorder suggestions
