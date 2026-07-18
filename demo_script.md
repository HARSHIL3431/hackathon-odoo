# Demo Script: Rental Management ERP

## Preparation
- Ensure the server is running (`npm run dev`)
- Ensure the database is seeded (`npx tsx prisma/seed.ts`)

## 1. Customer Portal
**Credentials:** 
- Email: `customer1@example.com`
- Password: `password123`

**Script:**
1. Log in as Customer 1.
2. Navigate to the **Catalog**. Showcase the UI/UX and product cards.
3. Add a product (e.g. Heavy Duty Drill) to the cart.
4. Go to **Cart** and proceed to **Checkout**.
5. Emphasize how checkout groups quantities but unrolls them into distinct DB orders for physical tracking.
6. Navigate to **My Orders** to show the newly created "Draft/Paid" orders alongside historical ones.

## 2. Vendor Portal
**Credentials:** 
- Email: `vendor@rental.com`
- Password: `password123`

**Script:**
1. Log in as Vendor.
2. Navigate to the **Vendor Dashboard**.
3. Highlight the realistic metrics:
   - *Active Orders*: 2 (1 due today, 1 overdue)
   - *Overdue*: 1 (shows the concrete mixer)
   - *Settled*: 2 (1 on-time, 1 penalty applied)
4. Go to **Order Management**.
5. **Edge Case 1 (Illegal Transition):** Find a "Draft" or newly created order. Attempt to click "Return" directly.
   - *Result*: Point out the 409 Conflict error ("Cannot return from state...").
6. **Edge Case 2 (Penalty Calculation):** Settle an overdue order (the Concrete Mixer).
   - *Result*: Show the calculated penalty amount subtracted from the deposit. Emphasize that it correctly calculates `daysLate * lateFeePerDay` and floors the refund at 0 if penalty exceeds deposit.
7. Return a currently active, on-time order (Heavy Duty Drill). Verify stock increments by 1. 

## 3. Admin Portal
**Credentials:** 
- Email: `admin@rental.com`
- Password: `password123`

**Script:**
1. Log in as Admin.
2. Navigate to the **Admin Dashboard** and review global system metrics.
3. Go to **User Management**.
   - Show how the table renders role tags and approval status (`isApproved`).
   - Toggle a user's role from `CUSTOMER` to `VENDOR`.
4. Go to **Pricelists**.
   - Create a new "VIP Customers" pricelist with a 20% discount. 
   - Check the "Set as Default" box and save. Point out that the previous default list is automatically toggled off.
5. Go to **Settings**.
   - Show the dynamic inputs for global `lateFeeDefault` and `gracePeriodHours`.
   - Update a value and save, proving the backend singleton update flow.
