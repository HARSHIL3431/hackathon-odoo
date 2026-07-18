import { PrismaClient, OrderState, QuotationType, Role } from '@prisma/client';
import { processTransition } from './lib/rental-logic';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Setup: Get users and products
  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' as any } });
  const vendor = await prisma.user.findFirst({ where: { role: 'VENDOR' as any } });
  const product = await prisma.product.findFirst();

  if (!customer || !vendor || !product) throw new Error("Missing seed data");

  // Helper to create an order
  const createOrder = async (endDateDiff: number, state: OrderState = OrderState.Active) => {
    return await prisma.rentalOrder.create({
      data: {
        customerId: customer.id,
        productId: product.id,
        startDate: subDays(new Date(), 5),
        endDate: addDays(new Date(), endDateDiff), // endDateDiff relative to today
        state: state,
        quotationType: QuotationType.ONLINE,
        totalAmount: 100,
        depositAmount: 50,
      }
    });
  };

  console.log("Testing PickUp (Paid -> PickedUp -> Active)");
  const order1 = await createOrder(5, OrderState.Paid);
  await prisma.$transaction(async (tx) => {
    await processTransition(tx, order1.id, 'pickup');
  });
  const updated1 = await prisma.rentalOrder.findUnique({ where: { id: order1.id } });
  console.log(`Expected Active, got: ${updated1?.state}`);

  console.log("Testing Return & Settle On-Time");
  const order2 = await createOrder(0, OrderState.Active);
  await prisma.$transaction(async (tx) => {
    await processTransition(tx, order2.id, 'return');
    await processTransition(tx, order2.id, 'settle');
  });
  const updated2 = await prisma.rentalOrder.findUnique({ where: { id: order2.id } });
  console.log(`Expected penalty 0, got: ${updated2?.penaltyAmount}`);
  console.log(`Expected refund 50, got: ${updated2?.depositRefunded}`);

  console.log("Testing Return & Settle Late (1 day)");
  const order3 = await createOrder(-1, OrderState.Active);
  await prisma.$transaction(async (tx) => {
    await processTransition(tx, order3.id, 'return');
    await processTransition(tx, order3.id, 'settle');
  });
  const updated3 = await prisma.rentalOrder.findUnique({ where: { id: order3.id } });
  console.log(`Expected penalty ${product.lateFeePerDay}, got: ${updated3?.penaltyAmount}`);

  console.log("Testing Penalty Capped at Deposit");
  const order4 = await createOrder(-50, OrderState.Active); // 50 days late
  await prisma.$transaction(async (tx) => {
    await processTransition(tx, order4.id, 'return');
    await processTransition(tx, order4.id, 'settle');
  });
  const updated4 = await prisma.rentalOrder.findUnique({ where: { id: order4.id } });
  console.log(`Expected penalty 50 (capped), got: ${updated4?.penaltyAmount}`);
  console.log(`Expected refund 0, got: ${updated4?.depositRefunded}`);

  console.log("Testing Illegal Transition (Return before Pickup)");
  const order5 = await createOrder(5, OrderState.Draft);
  try {
    await prisma.$transaction(async (tx) => {
      await processTransition(tx, order5.id, 'return');
    });
    console.error("FAIL: Should have thrown");
  } catch (err: any) {
    console.log("Successfully caught illegal transition:", err.message);
  }

  console.log("Testing Concurrency / Settle Twice");
  try {
    await prisma.$transaction(async (tx) => {
      await processTransition(tx, order4.id, 'settle');
    });
    console.error("FAIL: Should have thrown");
  } catch (err: any) {
    console.log("Successfully caught double settle:", err.message);
  }

  console.log("All tests finished.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
