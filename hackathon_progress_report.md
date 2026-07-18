# Rental Management ERP
## Hackathon Progress Report

---

## 1. Overall Progress

- **Current Phase:** Transitioning to Phase 3 (Quotation & Checkout)
- **Overall Completion %:** ~35%
- **Completed Phases:** Phase 0 (Setup), Phase 1 (Auth), Phase 2 (Customer Catalog & Cart)
- **Current Task:** Phase 3 (Pending Approval)
- **Remaining Phases:** Phase 4 (Admin Dashboard), Phase 5 (Pickup & Return), Phase 6 (In-Store Quotation), Phase 7 (Polish), Phase 8 (Buffer)

---

## 2. Phase-by-Phase Summary

### Phase 0: Setup & Scaffolding
- **Objective:** Establish the foundation, database connection, and data models.
- **What was implemented:** Next.js 14 App Router setup, Prisma ORM integration, Neon PostgreSQL connection, database schema, and initial seeding.
- **Files created:** `prisma/schema.prisma`, `prisma/seed.ts`, `.env`
- **Database changes:** Created all core tables (User, Product, Pricelist, RentalOrder, Payment).
- **Business logic added:** None yet.
- **APIs implemented:** None yet.
- **UI implemented:** Scaffolding only.
- **Validation implemented:** Prisma schema level constraints.
- **Security implemented:** None yet.
- **Manual tests performed:** DB migration verified, Neon dashboard checked, seed script verified.
- **Definition of Done status:** ✅ Met
- **How this phase connects to the next:** Provides the Postgres backend and seeded data required for authentication and product displays.

### Phase 1: Authentication & Layout
- **Objective:** Secure the app with JWT sessions and role-based access control.
- **What was implemented:** JWT signing/verifying (via `jsonwebtoken`), HttpOnly cookies, Zod validation for auth routes, layout navbar, login/register pages, and explicit `AuthError` handling.
- **Files created:** `lib/auth.ts`, `lib/validators/auth.ts`, `app/api/auth/*/route.ts`, `app/login/page.tsx`, `app/register/page.tsx`, `components/LogoutButton.tsx`
- **Files modified:** `app/layout.tsx`, `.env`
- **Database changes:** Read/Write to `User` table for auth.
- **Business logic added:** Role guards (`requireCustomer`, `requireAdmin`), password hashing (`bcryptjs`), token generation.
- **APIs implemented:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
- **UI implemented:** Shared Navbar (dynamic based on session), Login form, Register form, 403 Forbidden dummy page.
- **Validation implemented:** Zod schemas for email format, password strength, and names.
- **Security implemented:** JWT stored in HttpOnly cookies, bcrypt hashing, explicit route guards catching `AuthError`.
- **Edge cases handled:** Duplicate email registration gracefully returns 400. Missing `JWT_SECRET` handled. Tampered JWTs silently return `null` session instead of crashing the layout.
- **Manual tests performed:** Attempted duplicate registration (passed 400), attempted admin access as customer (passed 403), verified Next.js build compilation (0 errors).
- **Definition of Done status:** ✅ Met
- **How this phase connects to the next:** The session and user ID are now available for cart creation and order association in future phases.

### Phase 2: Customer Catalog + Cart
- **Objective:** Allow customers to browse products, select valid rental dates, and maintain a client-side cart.
- **What was implemented:** Server-rendered product catalog, detailed product page with client-side rental math, strict date validation, and React Context-based cart state persisting to `localStorage`.
- **Files created:** `lib/pricing.ts`, `app/api/products/route.ts`, `components/ProductCard.tsx`, `components/CartProvider.tsx`, `components/CartBadge.tsx`, `components/AddToCartForm.tsx`, `components/CartSummary.tsx`, `app/products/[id]/page.tsx`, `app/cart/page.tsx`, `test-pricing.ts`
- **Files modified:** `app/page.tsx`, `app/layout.tsx`
- **Database changes:** Read from `Product` table.
- **Business logic added:** `calculateRentalPrice()` isolating duration calculation, stock validation, and deposit math.
- **APIs implemented:** `GET /api/products`, `POST /api/products` (Admin only).
- **UI implemented:** Catalog grid, Product Detail Page, Date/Quantity selector form, Cart Summary view.
- **Validation implemented:** Validates end date > start date, quantity <= stockQty, and quantity > 0 natively on the client and in pricing logic.
- **Security implemented:** Admin product creation route is protected.
- **Edge cases handled:** Negative rental duration rejected, requested quantity exceeding stock rejected, same-day rentals processed as 1 day.
- **Manual tests performed:** Invalid date UI test (passed), Stock validation UI test (passed), Price math verified via node script and UI (passed), Cart persistence across routes verified via UI (passed). Next 15 `async params` breaking change handled.
- **Definition of Done status:** ✅ Met
- **How this phase connects to the next:** The verified Cart Context state will be the input payload for the Checkout process (Phase 3).

---

## 3. Business Workflow Completed

The following sequence is 100% functional and verified in the codebase:

**Customer**
↓
Register / Login (creates session cookie)
↓
Browse Products (fetches live data from Postgres)
↓
View Product Details (fetches specific item)
↓
Select Dates & Quantity (triggers `calculateRentalPrice` validation)
↓
Add To Cart (saves to Context & `localStorage`)
↓
View Cart Summary (displays aggregated pricing)

---

## 4. Features Implemented

- **Customer Features:** Registration, Login, Logout, Product Browsing, Product Detail View, Dynamic Date Selection, Cart Management.
- **Admin Features:** Protected `/admin/*` boundary (throws 403 for customers). Admin `POST /api/products` API logic. (UI Dashboard is Planned, not implemented).
- **Backend Features:** JWT HttpOnly cookie management, `requireAdmin`/`requireCustomer` guard utilities, precise date-math pricing module (`lib/pricing.ts`).
- **Database Features:** Neon PostgreSQL connection pooler integration, Prisma Client generated, DB Seeded.
- **Authentication Features:** Bcrypt password verification, Zod input validation, JWT token signing/verification.
- **Validation Features:** Registration duplicate email checks, Product date logic checks (end date > start date, stock limit checks).
- **Business Logic:** `calculateRentalPrice` (Days × Rate + Deposit × Quantity).
- **UI Components:** `ProductCard`, `CartBadge`, `CartSummary`, `AddToCartForm`, Layout Navbar.

---

## 5. Database Status

| Table | Purpose | Relationships | Current Status |
|---|---|---|---|
| **User** | Tracks customers and admins. | `1-to-many` with `RentalOrder` | Implemented, Seeded (3 users) |
| **Product** | Catalog items for rent. | `1-to-many` with `RentalOrder` | Implemented, Seeded (3 items) |
| **Pricelist** | Future pricing variations. | None currently active | Planned, not implemented |
| **RentalOrder** | The Aggregate Root. Tracks the rental state machine. | Belongs to `User` & `Product`. `1-to-many` with `Payment`. | Planned, not implemented (schema exists, no data yet) |
| **Payment** | Tracks financial ledgers against orders. | Belongs to `RentalOrder` | Planned, not implemented |

- **Migrations Completed:** `20260718071407_init`
- **Seeded Data:** 3 Products (Heavy Duty Drill, Submersible Pump, Portable Generator), 2 Customers, 1 Admin.

---

## 6. API Status

| Method | Endpoint | Purpose | Auth | Validation | Status |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | Create customer | None | Zod (Email/Pass/Name) | Implemented |
| POST | `/api/auth/login` | Issue JWT | None | Zod (Email/Pass) | Implemented |
| POST | `/api/auth/logout` | Clear JWT | None | None | Implemented |
| GET | `/api/products` | List catalog | None | None | Implemented |
| POST | `/api/products` | Create product | Admin | None yet | Implemented (Logic only) |
| POST | `/api/orders` | Create Order | Customer | - | Planned, not implemented |
| POST | `/api/orders/:id/transition` | State Machine | Admin | - | Planned, not implemented |
| GET | `/api/dashboard` | Analytics | Admin | - | Planned, not implemented |

---

## 7. Folder Structure Walkthrough

- **`app/`**: Next.js 14 App Router directories. Contains route segments for UI (`page.tsx`) and API endpoints (`route.ts`).
- **`app/api/`**: Serverless functions handling backend logic, preventing direct DB access from the client.
- **`components/`**: Reusable React components (`ProductCard`, `CartBadge`). Separates UI concerns from routing logic.
- **`lib/`**: Core business logic and singletons. Contains `prisma.ts` (DB client), `auth.ts` (JWT logic), and `pricing.ts` (isolated rental math).
- **`lib/validators/`**: Zod schemas to ensure type-safe, validated inputs at the network boundary before reaching business logic.
- **`prisma/`**: Contains `schema.prisma` (the source of truth for the DB) and `seed.ts` (for demo environment setups).

---

## 8. Architecture Explanation

- **Why RentalOrder is the Aggregate Root:** It acts as the single source of truth for the entire business lifecycle. Product inventory, Payment ledgers, and Deposit settlements are side-effects of a state transition on the `RentalOrder`, guaranteeing data consistency and preventing orphaned records.
- **Why business logic is separated (`lib/pricing.ts`):** Math for days, deposits, and eventual late fees is complex and prone to edge-case bugs. Isolating it allows for pure-function testing (e.g., `test-pricing.ts`) without mocking Next.js requests or Prisma.
- **Why state transitions are centralized (`lib/rental-logic.ts` - Planned):** To enforce the state machine mathematically. It prevents a route from arbitrarily changing an order from `Draft` to `Returned` bypassing the `Paid` and `Active` states.
- **Why Prisma is used:** Provides incredible type-safety from DB to Frontend, drastically reducing runtime errors. It makes schema relations trivial compared to raw SQL.
- **Why PostgreSQL (Neon) was chosen:** Represents a true production ERP architecture (Odoo relies heavily on Postgres). Neon eliminates local setup risks while providing instant cloud connections.
- **Why JWT instead of NextAuth:** NextAuth has heavy configuration overhead and brings in concepts (OAuth, Adapters) outside the hackathon's scope. A simple HttpOnly cookie with `jsonwebtoken` provides identical security for this exact use case with zero bloat.

---

## 9. Edge Cases Already Solved

1. **Duplicate email registration:**
   - *How:* `POST /api/auth/register` queries Prisma for the email before creation.
   - *Result:* Returns `400 Bad Request` cleanly instead of throwing an unhandled Prisma constraint error (500).
2. **Unauthorized admin access:**
   - *How:* `requireAdmin()` throws a typed `AuthError(403)`. The Next.js page catches this in a `try/catch` and returns a fallback UI component.
   - *Result:* Users see a clean "403 Forbidden" instead of crashing the Next.js renderer.
3. **Negative rental duration / End date before start date:**
   - *How:* `lib/pricing.ts` performs `if (end < start) throw Error`.
   - *Result:* `AddToCartForm.tsx` catches the error, displays an inline red banner, and disables the submit button.
4. **Stock validation (Quantity > Stock):**
   - *How:* `lib/pricing.ts` checks `quantity > product.stockQty`.
   - *Result:* Inline error is presented dynamically to the user; cart submission is blocked.
5. **Next.js 15 Async Params:**
   - *How:* Dynamic route `app/products/[id]/page.tsx` was crashing due to Next.js 15 treating `params` as a Promise.
   - *Result:* Fixed by `await params` before destructuring `id`, ensuring no Hydration or Prisma undefined errors.

---

## 10. Live Demo Flow

**If I had 5 minutes with a judge:**

1. **Open the Homepage (`/`)**: Show the grid of products fetched live from Neon Postgres.
2. **Login**: Click Login, use `customer1@example.com` / `password123`. Note the JWT session instantly changing the Navbar to "Welcome, Customer One".
3. **Edge Case Demo**: Click the "Heavy Duty Drill".
   - Enter a Start Date of tomorrow.
   - Enter an End Date of yesterday.
   - Point out the red validation error and disabled button (proving business rules matter).
4. **Happy Path**: Correct the dates to a 3-day window. Point out the dynamic math calculating the exact Rental Cost + Deposit.
5. **Add to Cart**: Click Add to Cart. Show the navigation to `/cart`, proving the React Context cart persisted the state successfully.
6. **Security Demo**: Open a new tab to `/admin/dashboard` as the customer. Show the 403 Forbidden page, proving route boundaries work securely.

---

## 11. Questions an Evaluator May Ask

1. **Why use React Context for the Cart instead of Redux?**
   - *Answer:* For this scope, the cart is a small array of items. Redux adds massive boilerplate. Context + `useState` + `localStorage` achieves the exact same persistence with zero dependencies.
2. **What happens if someone modifies the `localStorage` cart payload to manipulate prices?**
   - *Answer:* The client-side cart is only for UX. In Phase 3, the backend will recalculate the price based purely on the `productId` and dates provided, ignoring any prices sent from the client.
3. **How does your `requireAdmin()` guard actually prevent unauthorized access?**
   - *Answer:* It reads the `HttpOnly` cookie directly from Next.js `cookies()`, verifies the JWT signature using a secret only the server knows, and checks the `role` payload. A user cannot forge this cookie.
4. **Why did you use `date-fns` over `moment.js`?**
   - *Answer:* `moment.js` is deprecated, heavy, and mutates dates. `date-fns` is modular, immutable, and tree-shakeable.
5. **If I refresh the page, why doesn't my layout crash if the JWT is expired?**
   - *Answer:* The `getSession()` utility wraps the JWT verification in a `try/catch`. If verification fails, it swallows the error and simply returns `null`, gracefully degrading the user to a logged-out state.
*(... 25 more similar technical questions omitted for brevity but represent standard stack inquiries ...)*

---

## 12. Business Questions

1. **Why collect a deposit?**
   - *Answer:* Rental equipment represents significant capital. The deposit mitigates the risk of theft, damage, or extreme late returns without requiring complex credit-check integrations.
2. **Why is RentalOrder the central entity instead of having separate "Order" and "Rental" tables?**
   - *Answer:* In a pure rental business, the "Sale" *is* the "Rental". Splitting them creates synchronization issues. A single `RentalOrder` with a robust state machine perfectly maps to the physical lifecycle of the equipment.
3. **Why charge a late fee?**
   - *Answer:* To incentivize timely returns. Equipment not returned is equipment that cannot be rented to the next customer, causing compounding revenue loss.
4. **Why use a strict state machine (Draft → Paid → Active → Settled)?**
   - *Answer:* It prevents physical impossibilities (e.g., returning an item that was never picked up) and ensures accurate financial accounting (you can't settle a deposit that was never paid).
5. **Why wrap checkout in a database transaction?**
   - *Answer:* If a customer's payment succeeds but the `RentalOrder` fails to insert, the business is legally liable. Transactions guarantee atomic consistency—either everything succeeds, or everything rolls back safely.

---

## 13. Software Engineering Questions

1. **Why JWT over server-side session IDs?**
   - *Answer:* JWTs are stateless. We don't need a `Sessions` table in our DB, reducing latency and making the application trivially horizontally scalable.
2. **Why use Next.js App Router instead of Pages router?**
   - *Answer:* React Server Components (RSC) allow us to fetch Prisma data directly in the component (like the Catalog page) without exposing API endpoints or shipping massive JSON to the client.
3. **Why Zod for validation?**
   - *Answer:* Zod provides runtime schema validation that automatically infers TypeScript types. It guarantees that the shape of the data entering our API exactly matches our TypeScript expectations.
4. **Why PostgreSQL over SQLite?**
   - *Answer:* SQLite breaks on Serverless platforms (like Vercel) because the filesystem is ephemeral. Postgres on Neon allows serverless functions to connect reliably without data loss.
5. **Why Prisma over raw SQL?**
   - *Answer:* Prisma provides autocompletion, type-safety, and protects entirely against SQL injection.

---

## 14. Odoo Mapping

This project maps directly to core Odoo modules:
- **Rental (odoo/rental):** The core lifecycle (Pickup/Return/Late Fees) mirrors Odoo's Rental App scheduling.
- **Sales (odoo/sale):** Our `Draft` → `Confirmed` state maps exactly to Odoo's Quotation → Sale Order flow.
- **Inventory (odoo/stock):** Our `stockQty` validation mirrors Odoo's `stock.quant` available quantity checks.
- **Accounting (odoo/account):** The `Payment` table and deposit settlement logic reflect Odoo's Invoice and Payment Ledger reconciliations.
- **CRM (odoo/crm):** The `User` table maps to Odoo's `res.partner` (Contacts).

---

## 15. Remaining Work

- **Completed:** Phase 0 (DB Setup), Phase 1 (Auth), Phase 2 (Catalog/Cart)
- **Current:** Phase 3 (Quotation & Checkout)
- **Remaining:** Phase 4 (Admin Dashboard), Phase 5 (Pickup & Return - *Core Logic*), Phase 6 (In-store Flow), Phase 7 (Polish).
- **Blocked:** None.
- **Out of Scope:** Real payment gateway integration (Stripe), PDF Invoice generation, Email notifications.

---

## 16. Risks

1. **Schema Defect (Technical Debt):** The current `RentalOrder` schema in `schema.prisma` lacks a `quantity` field. Phase 2 cart allows selecting quantities > 1. For Phase 3, we must either amend the schema to include `quantity Int @default(1)` OR loop and create multiple `RentalOrder` rows per cart item. I strongly suggest adding the field to the schema.
2. **Connection Pooling:** Dev server logs showed a transient `PrismaClientKnownRequestError` indicating the Neon DB briefly couldn't be reached. This is a common serverless cold-start issue but shouldn't affect the final demo heavily.
3. **Time constraints:** Phase 5 is the most critical grading criteria (penalty math and state transitions). We must ensure we do not run out of time before completing Phase 5.

---

## 17. Elevator Pitch

- **30-second:** "We built a specialized Rental Management ERP using Next.js and Postgres. It handles the entire lifecycle of equipment rentals—from online checkout to physical pickup, return, and automated late-fee deposit settlements—driven by a strict, unbreakable state machine."
- **1-minute:** "Unlike generic e-commerce stores, rental businesses require tracking physical assets across time and managing financial deposits. Our ERP solves this by treating the `RentalOrder` as an aggregate root moving through a strict state machine (Draft, Paid, Active, Settled). Built on Next.js 14 and Prisma, it offers a customer-facing catalog and cart, combined with a secure admin backend for managing pickups, returns, and dynamically calculating late penalties against held deposits."
- **3-minute:** *(Expands on the above, demonstrating the exact user flow, explaining the technical choice of Neon Postgres, and comparing the architecture directly to Odoo's Rental and Sales modules.)*

---

## 18. Judge Demo Script

**Developer:** "Hi, welcome! For this hackathon, we didn't just want to build a basic store; we built a production-grade Rental ERP modeled after Odoo's core principles.
**[Action: Show Homepage]**
"Here is the customer-facing catalog, fetched live from a Neon Serverless Postgres DB. Let's log in."
**[Action: Log in as customer1]**
"We are using secure, stateless JWTs via HttpOnly cookies. Notice the UI updates instantly. Let's rent the Heavy Duty Drill."
**[Action: Click product, enter Invalid Dates]**
"Edge cases matter. If a customer enters an end date before a start date, our pricing logic strictly rejects it. It's not just a UI trick; the math function itself throws an error."
**[Action: Enter valid dates, click Add to Cart, go to /cart]**
"We add it to the cart. The state persists perfectly via React Context. From here, the customer would check out, creating a `RentalOrder`."
**[Action: Manually type `/admin/dashboard` in URL bar]**
"Security is paramount. If this customer tries to guess our admin routes, our server-side guards intercept it and return a strict 403 Forbidden, protecting the business logic."

---

## 19. Confidence Check

- **Not Fully Implemented:** Checkout (Phase 3) is entirely unwritten. You can add to the cart, but you cannot currently buy.
- **Demo Warning:** Do not click "Proceed to Checkout" in the cart right now—it does nothing.
- **Before Phase 3 Begins:** We MUST decide how to handle multiple quantities. Either we write a Prisma migration to add `quantity` to `RentalOrder`, or we build the checkout logic to map `1 Cart Item (Qty 3)` -> `3 separate RentalOrder rows`. (I recommend the schema update for a cleaner ERP architecture).
