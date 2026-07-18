import { PrismaClient } from '@prisma/client';
import { processCheckout } from './lib/rental-logic';

const prisma = new PrismaClient();

async function testIdempotency() {
  console.log('--- IDEMPOTENCY TEST (Double-Click Prevention) ---\n');

  const customer = await prisma.user.findUnique({ where: { email: 'customer1@example.com' } });
  const product = await prisma.product.findFirst({ where: { name: 'Heavy Duty Drill' } });

  if (!customer || !product) {
    console.error('Test data missing');
    return;
  }

  // Restore stock
  await prisma.product.update({ where: { id: product.id }, data: { stockQty: 5 } });

  const checkoutPayload = {
    productId: product.id,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    quantity: 2,
  };

  console.log('Test 1: First checkout request');
  let orderIds1: string[] = [];
  try {
    orderIds1 = await prisma.$transaction(async (tx) => {
      return await processCheckout(tx, customer.id, [checkoutPayload], 'Credit Card');
    }, { timeout: 30000 });
    console.log(`✅ PASS: Created ${orderIds1.length} orders`);
  } catch (e: any) {
    console.log(`❌ FAIL: ${e.message}`);
    return;
  }

  console.log('\nTest 2: Immediate duplicate checkout request (simulating double-click)');
  let orderIds2: string[] = [];
  try {
    orderIds2 = await prisma.$transaction(async (tx) => {
      return await processCheckout(tx, customer.id, [checkoutPayload], 'Credit Card');
    }, { timeout: 30000 });
    // If it returns the same order IDs, it's working correctly
    if (orderIds2.length === orderIds1.length && orderIds2[0] === orderIds1[0]) {
      console.log(`✅ PASS: Duplicate returned existing order IDs (${orderIds2.length} orders) - no new orders created`);
    } else {
      console.log(`❌ FAIL: Created new orders (${orderIds2.length} vs ${orderIds1.length})`);
    }
  } catch (e: any) {
    console.log(`❌ FAIL: ${e.message}`);
    return;
  }

  console.log('\nTest 3: Verify only 2 orders exist in DB for this product/customer/dates');
  const allOrders = await prisma.rentalOrder.findMany({
    where: {
      customerId: customer.id,
      productId: product.id,
      state: 'Paid',
    },
  });
  console.log(`Found ${allOrders.length} total Paid orders in DB for this customer/product`);
  if (allOrders.length === 2) {
    console.log('✅ PASS: Only the original 2 orders exist (quantity was 2, unrolled to 2 orders)');
  } else {
    console.log(`❌ FAIL: Expected 2 orders, found ${allOrders.length}`);
  }

  console.log('\nTest 4: Third request (still within 30s window)');
  let orderIds3: string[] = [];
  try {
    orderIds3 = await prisma.$transaction(async (tx) => {
      return await processCheckout(tx, customer.id, [checkoutPayload], 'Credit Card');
    }, { timeout: 30000 });
    if (orderIds3.length === orderIds1.length && orderIds3[0] === orderIds1[0]) {
      console.log(`✅ PASS: Third request also returned existing orders - idempotent`);
    } else {
      console.log(`❌ FAIL: Third request created new orders`);
    }
  } catch (e: any) {
    console.log(`❌ FAIL: ${e.message}`);
  }

  // Cleanup
  await prisma.product.update({ where: { id: product.id }, data: { stockQty: 5 } });

  console.log('\n--- IDEMPOTENCY TEST COMPLETE ---');
}

testIdempotency().catch(console.error).finally(() => prisma.$disconnect());
