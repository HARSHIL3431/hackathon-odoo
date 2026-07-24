# Odoo Rental ERP

A high-performance, responsive Equipment Rental Enterprise Resource Planning (ERP) application clone modeled after Odoo, built with Next.js App Router, Prisma ORM, and PostgreSQL.

## Features

### 👤 Role-Based Portals (RBAC)
- **Customer Portal:** Browse the equipment catalog, search and filter by category/availability, manage add-to-cart selections, and complete secure atomic checkouts.
- **Vendor Portal:** Manage handovers and returns. High-performance operation dashboard showing KPIs for "Ready for Pickup", "Currently Rented", "Due Today", and "Overdue Returns".
- **Admin Portal:** Master control panel featuring platform health overview, pricing configuration (Pricelists/Discounts), user approval systems, and global system setting overrides (default late fees, grace periods).

### ⚙️ Rental & Inventory Engines
- **Atomic Checkout (`processCheckout`):** Cart checkouts are executed inside database transactions with custom idempotency checking to prevent double-click duplication.
- **Dynamic Overlap Availability Engine:** Availability is determined on-the-fly by querying overlapping confirmed and active rental ranges rather than decrementing static stock counters, preventing synchronization issues.
- **Billing & Penalty Rules:** Integrates hourly/daily billing models and dynamic late-fee calculations with configurable grace periods.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router with Turbopack compilation)
- **Database ORM:** Prisma ORM
- **Database:** PostgreSQL ( Neon Serverless )
- **Styling:** Tailwind CSS & Lucide Icons
- **Validation:** Zod schemas
- **Cryptography:** bcryptjs password hashing & JWT cookies

---

## Installation & Local Development

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@host/neondb?sslmode=require"
JWT_SECRET="your-super-secure-jwt-secret-key"
NODE_ENV="development"
```

### 3. Generate Database Client
```bash
npx prisma generate
```

### 4. Run Database Seed
To set up mock items and test roles (customer, vendor, admin):
```bash
npx prisma db seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Production Deployment

### Build Verification
To ensure compilation and type safety:
```bash
npx tsc --noEmit
npm run build
```

### Deploying to Vercel
1. Set up the repository on GitHub.
2. Link your Vercel project to the repository.
3. Configure the environment variables (`DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET`) in Vercel settings.
4. Set the install command to `npm install` and build command to `npm run build`.
