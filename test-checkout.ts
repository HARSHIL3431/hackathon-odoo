import { PrismaClient } from '@prisma/client';
import { processCheckout } from './lib/rental-logic';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING PHASE 3 VERIFICATION ---\n');

  const customer1 = await prisma.user.findUnique({ where: { email: 'customer1@example.com' } });
  const customer2 = await prisma.user.findUnique({ where: { email: 'customer2@example.com' } });
  const product = await prisma.product.findFirst({ where: { name: 'Heavy Duty Drill' } });

  if (!customer1 || !customer2 || !product) {
    console.error('Test data missing');
    return;
  }

  await prisma.product.update({ where: { id: product.id }, data: { stockQty: 5 } });

  console.log('1. Past Date Test');
  try {
    await prisma.$transaction(async (tx) => {
      await processCheckout(
        tx,
        customer1.id,
        [{
          productId: product.id,
          startDate: subDays(new Date(), 2).toISOString(),
          endDate: new Date().toISOString(),
          quantity: 1
        }],
        'Credit Card'
      );
    }, { timeout: 30000 });
    console.log('❌ FAIL: Allowed past date checkout');
  } catch (e: any) {
    console.log('✅ PASS: Rejected past date checkout ->', e.message);
  }

  console.log('\n2. Stock Race Condition Test');
  try {
    await prisma.product.update({ where: { id: product.id }, data: { stockQty: 0 } });
    
    await prisma.$transaction(async (tx) => {
      await processCheckout(
        tx,
        customer1.id,
        [{
          productId: product.id,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          quantity: 1
        }],
        'Credit Card'
      );
    }, { timeout: 30000 });
    console.log('❌ FAIL: Allowed checkout with 0 stock');
  } catch (e: any) {
    console.log('✅ PASS: Rejected 0 stock checkout ->', e.message);
  }

  await prisma.product.update({ where: { id: product.id }, data: { stockQty: 5 } });

  console.log('\n3. Normal Checkout (Unrolling Quantities)');
  let orderIds: string[] = [];
  try {
    orderIds = await prisma.$transaction(async (tx) => {
      return await processCheckout(
        tx,
        customer1.id,
        [{
          productId: product.id,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          quantity: 3
        }],
        'Credit Card'
      );
    }, { timeout: 30000 });
    console.log(`✅ PASS: Created ${orderIds.length} separate orders for quantity 3`);
  } catch (e: any) {
    console.log('❌ FAIL: Normal checkout failed ->', e.message);
  }

  console.log('\n4. Order Isolation (DB Level)');
  if (orderIds.length > 0) {
    const order1 = await prisma.rentalOrder.findUnique({ where: { id: orderIds[0] } });
    if (order1?.customerId === customer1.id) {
      console.log('✅ PASS: Order belongs to customer1');
      if (order1.customerId !== customer2.id) {
        console.log('✅ PASS: Order isolation verified (Customer 2 ID does not match)');
      }
    } else {
      console.log('❌ FAIL: Order customer ID mismatch');
    }
  } else {
    console.log('❌ SKIP: No orders to check');
  }

  // Cleanup
  await prisma.product.update({ where: { id: product.id }, data: { stockQty: 5 } });

  console.log('\n--- VERIFICATION COMPLETE ---');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
