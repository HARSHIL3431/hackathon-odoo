import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('=== PHASE 3 DATABASE VERIFICATION ===\n');

  // 1. Get product state BEFORE checkout
  const product = await prisma.product.findFirst({ where: { name: 'Heavy Duty Drill' } });
  if (!product) { console.log('FAIL: Product not found'); return; }
  
  // Reset stock to a known value for clean test
  await prisma.product.update({ where: { id: product.id }, data: { stockQty: 5 } });
  const before = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`Product ID: ${before!.id}`);
  console.log(`Stock BEFORE checkout: ${before!.stockQty}`);

  // 2. Count existing orders for customer1
  const customer = await prisma.user.findUnique({ where: { email: 'customer1@example.com' } });
  if (!customer) { console.log('FAIL: Customer not found'); return; }
  const ordersBefore = await prisma.rentalOrder.count({ where: { customerId: customer.id } });
  console.log(`Orders BEFORE checkout: ${ordersBefore}`);

  // 3. Run checkout via rental-logic (simulating what the API does)
  const { processCheckout } = await import('./lib/rental-logic');
  const qty = 2;
  
  let orderIds: string[] = [];
  try {
    orderIds = await prisma.$transaction(async (tx) => {
      return await processCheckout(
        tx,
        customer.id,
        [{
          productId: product.id,
          startDate: new Date('2026-08-01').toISOString(),
          endDate: new Date('2026-08-05').toISOString(),
          quantity: qty
        }],
        'Credit Card'
      );
    });
    console.log(`\nCheckout succeeded. Created ${orderIds.length} orders.`);
  } catch (e: any) {
    console.log(`FAIL: Checkout threw: ${e.message}`);
    return;
  }

  // 4. Verify DB state AFTER checkout
  const after = await prisma.product.findUnique({ where: { id: product.id } });
  console.log(`\nStock AFTER checkout: ${after!.stockQty}`);
  console.log(`Stock decrement: ${before!.stockQty} - ${after!.stockQty} = ${before!.stockQty - after!.stockQty}`);
  console.log(`Expected decrement: ${qty}`);
  console.log(`Stock decrement correct: ${(before!.stockQty - after!.stockQty) === qty ? 'PASS' : 'FAIL'}`);

  const ordersAfter = await prisma.rentalOrder.count({ where: { customerId: customer.id } });
  console.log(`\nOrders AFTER checkout: ${ordersAfter}`);
  console.log(`New orders created: ${ordersAfter - ordersBefore}`);
  console.log(`Expected new orders: ${qty}`);
  console.log(`Order count correct: ${(ordersAfter - ordersBefore) === qty ? 'PASS' : 'FAIL'}`);

  // 5. Verify each order
  for (const orderId of orderIds) {
    const order = await prisma.rentalOrder.findUnique({
      where: { id: orderId },
      include: { payments: true, product: true }
    });
    if (!order) { console.log(`FAIL: Order ${orderId} not found`); continue; }
    
    console.log(`\n--- Order ${orderId.slice(0, 8)} ---`);
    console.log(`  State: ${order.state}`);
    console.log(`  Customer ID: ${order.customerId}`);
    console.log(`  Product ID: ${order.productId}`);
    console.log(`  Product name: ${order.product.name}`);
    console.log(`  FK match product: ${order.productId === product.id ? 'PASS' : 'FAIL'}`);
    console.log(`  FK match customer: ${order.customerId === customer.id ? 'PASS' : 'FAIL'}`);
    console.log(`  State is Paid: ${order.state === 'Paid' ? 'PASS' : 'FAIL'}`);
    console.log(`  Payment records: ${order.payments.length}`);
    console.log(`  Payment amount: ${order.payments[0]?.amount}`);
    console.log(`  Payment status: ${order.payments[0]?.status}`);
  }

  // 6. Check for duplicates
  const allOrdersForProduct = await prisma.rentalOrder.findMany({
    where: { customerId: customer.id, productId: product.id, startDate: new Date('2026-08-01') }
  });
  // Only the orders we just created should match (plus any from prior test runs)
  console.log(`\nDuplicate check: ${orderIds.length} orders created, ${allOrdersForProduct.length} total matching orders in DB`);
  
  // 7. Verify customer2 cannot see these orders (logic check)
  const customer2 = await prisma.user.findUnique({ where: { email: 'customer2@example.com' } });
  if (customer2) {
    const c2Orders = await prisma.rentalOrder.findMany({ where: { customerId: customer2.id, id: { in: orderIds } } });
    console.log(`Order isolation (customer2 sees 0 of these): ${c2Orders.length === 0 ? 'PASS' : 'FAIL'}`);
  }

  console.log('\n=== VERIFICATION COMPLETE ===');
}

verify().catch(console.error).finally(() => prisma.$disconnect());
