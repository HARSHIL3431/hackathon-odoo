# ARCHITECTURE.md — Rental Management System

## 1. Tech Stack
- **Framework**: Next.js 14 (App Router, TypeScript)
- **DB**: **PostgreSQL** via **Prisma ORM**, hosted on **Neon** (free serverless Postgres, instant connection string, zero local install). Matches Odoo's own DB choice — a stronger answer to judges than SQLite, without the setup risk of a local Postgres install.
- **Auth**: Simple JWT (httpOnly cookie) — no NextAuth, avoid config overhead
- **Styling**: Tailwind CSS
- **State**: React Server Components + minimal client state (no Redux)
- **Deployment**: local demo is fine; Vercel also works cleanly with Neon (no file-persistence issue like SQLite had)

Rationale: Postgres via Neon gives ERP-appropriate DB credibility with none of local-Postgres's setup risk mid-hackathon.

## 2. State Machine — Transition Table
| Current State | Allowed Actions | Next State |
|---|---|---|
| Draft | confirm, cancel | Confirmed |
| Confirmed | pay, cancel | Paid |
| Paid | pickup | PickedUp |
| PickedUp | activate | Active |
| Active | return | Returned |
| Returned | settle | Settled |
| Settled | — (terminal) | — |

Any action not listed for the current state is rejected with 409.

## 2a. State Machine Diagram
```
Draft → Confirmed → Paid → PickedUp → Active → Returned → Settled
```
- **Draft**: cart/quotation not yet confirmed
- **Confirmed**: customer or admin confirmed the quotation (= Sale Order)
- **Paid**: invoice paid, deposit collected
- **PickedUp**: product handed over, inventory decremented
- **Active**: rental period in progress
- **Returned**: product physically back, pending inspection
- **Settled**: deposit refund calculated and finalized (terminal state)

No state can be skipped. Every transition is a backend function, not a raw DB update.

## 3. High-Level Flow
```
Customer                          Admin
   │                                │
Browse → Cart → Checkout           Product/Pricelist setup
   │                                │
Payment (stub) ──────────────► Rental Order created (Draft→Paid)
   │                                │
                              Pickup confirmation (Paid→PickedUp→Active)
   │                                │
Return request ──────────────► Inspection (Active→Returned)
                                    │
                              Penalty calc → Settled
```

In-store path: Admin creates quotation directly (skips customer browsing), same state machine from Confirmed onward.

## 4. Folder Structure
```
/app
  /(customer)
    /page.tsx                 → home/product listing
    /products/[id]/page.tsx
    /cart/page.tsx
    /checkout/page.tsx
    /orders/page.tsx
  /(admin)
    /admin/dashboard/page.tsx
    /admin/products/page.tsx
    /admin/orders/page.tsx
    /admin/orders/[id]/page.tsx   → pickup/return actions
    /admin/quotation/new/page.tsx
  /api
    /auth/[...]/route.ts
    /orders/route.ts
    /orders/[id]/transition/route.ts   → state machine endpoint
    /products/route.ts
    /dashboard/route.ts
  /login/page.tsx
  /register/page.tsx
/lib
  /prisma.ts
  /auth.ts
  /rental-logic.ts          → deposit + late fee calculation, state guards
/prisma
  /schema.prisma
/components
  /ui/ (buttons, cards, badges)
  /ProductCard.tsx
  /OrderStatusBadge.tsx
  /DashboardWidget.tsx
```

## 5. Data Model (Prisma, simplified)

**RentalOrder is the central entity. No module modifies Product, Payment, or Deposit state directly — every action flows through RentalOrder first.**

```
              Product
                 │
              RentalOrder  ◄── all modules read/write through this
            ┌────┼────┬────────┐
        Payment Pickup Return Settlement
```

```
User (id, name, email, passwordHash, role: CUSTOMER|ADMIN)
Product (id, name, description, rentalPricePerDay, depositAmount, lateFeePerDay, stockQty)
Pricelist (id, name, isDefault, discountPercent, validFrom, validTo)
RentalOrder (id, customerId, productId, startDate, endDate, state, quotationType: ONLINE|INSTORE,
             totalAmount, depositAmount, depositRefunded, penaltyAmount, createdAt)
Payment (id, orderId, amount, method, status, paidAt)
```

Example: a late return does NOT directly update Product.stockQty or write a refund record on its own — it calls `rental-logic.ts`, which reads/writes RentalOrder.state and RentalOrder.penaltyAmount, and Product/Payment updates happen as a side effect of that single transition, not as independent writes.

## 5a. ER Diagram
```
┌──────────┐        ┌──────────────┐        ┌─────────┐
│  User    │1      *│  RentalOrder │*      1│ Product │
│----------│────────│--------------│────────│---------│
│ id       │        │ id           │        │ id      │
│ name     │        │ customerId   │        │ name    │
│ email    │        │ productId    │        │ price   │
│ role     │        │ state        │        │ deposit │
└──────────┘        │ startDate    │        │ lateFee │
                     │ endDate      │        │ stock   │
                     │ depositAmt   │        └─────────┘
                     │ penaltyAmt   │
                     └──────┬───────┘
                            │1
                            │
                            │*
                     ┌──────────────┐
                     │   Payment    │
                     │--------------│
                     │ id           │
                     │ orderId      │
                     │ amount       │
                     │ method       │
                     │ status       │
                     └──────────────┘
```
Relationships: User 1—* RentalOrder, Product 1—* RentalOrder, RentalOrder 1—* Payment.

## 5b. Sequence Diagram (online flow)
```
Customer          Frontend          API             RentalOrder(state)      DB
   │ Browse+Add      │                │                     │               │
   │─────────────────▶                │                     │               │
   │ Checkout+Pay     │                │                     │               │
   │─────────────────▶ POST /orders   │                     │               │
   │                  │───────────────▶ create → Draft      │               │
   │                  │                │──────────────────────────────────▶ │
   │                  │                │ transition → Paid  │               │
   │                  │◀───────────────│                     │               │
   │ Invoice shown     │                │                     │               │
Admin picks up product │                │                     │               │
   │                  │  POST /orders/:id/transition {pickup}│               │
   │                  │───────────────▶ Paid → PickedUp → Active            │
Admin processes return  │                │                     │               │
   │                  │  POST .../transition {return}         │               │
   │                  │───────────────▶ Active → Returned      │               │
   │                  │                │ penalty calc          │               │
   │                  │                │ Returned → Settled    │               │
   │                  │◀───────────────│ refund breakdown       │               │
```

## 5c. API Contract (one page)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | create customer/admin account |
| POST | `/api/auth/login` | issue JWT httpOnly cookie |
| GET | `/api/products` | list products |
| POST | `/api/products` | (admin) create product |
| POST | `/api/orders` | create RentalOrder (Draft) |
| POST | `/api/orders/:id/transition` | body `{action: confirm\|pay\|pickup\|return\|settle}` — only legal path enforced |
| GET | `/api/orders?filter=` | list orders (active/overdue/completed) |
| GET | `/api/dashboard` | aggregated dashboard metrics |

## 6. API Design (minimal REST)
- `POST /api/auth/register|login`
- `GET/POST /api/products`
- `POST /api/orders` (create draft)
- `POST /api/orders/:id/transition` — body: `{ action: "confirm"|"pay"|"pickup"|"return"|"settle" }`, server validates legal transition and runs business logic
- `GET /api/dashboard` — aggregates for admin dashboard

Keep the state machine logic in **one file** (`lib/rental-logic.ts`) — never scatter transition logic across routes.
