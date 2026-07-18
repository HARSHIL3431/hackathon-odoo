import { OrderState, Prisma, QuotationType } from '@prisma/client';
import { calculateRentalPrice } from './pricing';
import { startOfDay, isBefore } from 'date-fns';

export interface CheckoutItem {
  productId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  quantity: number;
}

/**
 * Validates stock, calculates pricing securely, and creates RentalOrder/Payment
 * rows in a single atomic transaction. Unrolls quantity into separate RentalOrders.
 */
export async function processCheckout(
  prisma: Prisma.TransactionClient,
  userId: string,
  items: CheckoutItem[],
  method: string,
  quotationType: QuotationType = QuotationType.ONLINE
): Promise<string[]> {
  const createdOrderIds: string[] = [];

  // Group quantities to check total requested against stock
  const requestedStock: Record<string, number> = {};
  for (const item of items) {
    requestedStock[item.productId] = (requestedStock[item.productId] || 0) + item.quantity;
  }

  // Iterate all distinct products to validate stock & fetch current pricing
  const products = await prisma.product.findMany({
    where: { id: { in: Object.keys(requestedStock) } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate all items
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    
    if (requestedStock[item.productId] > product.stockQty) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const start = startOfDay(new Date(item.startDate));
    const end = startOfDay(new Date(item.endDate));
    const today = startOfDay(new Date());

    if (isBefore(start, today)) {
      throw new Error(`Start date cannot be in the past for ${product.name}`);
    }
    if (isBefore(end, start)) {
      throw new Error(`End date cannot be before start date for ${product.name}`);
    }
  }

  // Process inside the transaction
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    
    // Decrement stock (since all requested items are valid)
    await prisma.product.update({
      where: { id: product.id },
      data: { stockQty: { decrement: item.quantity } },
    });

    // We calculate price for ONE unit since we are unrolling
    const pricing = calculateRentalPrice(
      { rentalPricePerDay: product.rentalPricePerDay, depositAmount: product.depositAmount, stockQty: 9999 }, // stockQty bypass for math
      new Date(item.startDate),
      new Date(item.endDate),
      1
    );

    // Unroll quantity into individual orders
    for (let i = 0; i < item.quantity; i++) {
      // 1. Draft
      const order = await prisma.rentalOrder.create({
        data: {
          customerId: userId,
          productId: product.id,
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate),
          state: OrderState.Draft,
          quotationType,
          totalAmount: pricing.rentalTotal,
          depositAmount: pricing.depositTotal,
          depositRefunded: 0,
          penaltyAmount: 0,
        },
      });

      // 2. Confirmed
      await prisma.rentalOrder.update({
        where: { id: order.id },
        data: { state: OrderState.Confirmed },
      });

      // 3. Paid
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: pricing.grandTotal,
          method,
          status: 'Success',
        },
      });

      await prisma.rentalOrder.update({
        where: { id: order.id },
        data: { state: OrderState.Paid },
      });

      createdOrderIds.push(order.id);
    }
  }

  return createdOrderIds;
}
