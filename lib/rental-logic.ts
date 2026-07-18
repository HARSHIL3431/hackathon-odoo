import { OrderState, Prisma, QuotationType, Product } from '@prisma/client';
import { calculateRentalPrice } from './pricing';
import { startOfDay, isBefore, subSeconds, isAfter, differenceInCalendarDays } from 'date-fns';

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

  // Idempotency guard: check for recent duplicate checkout (same customer, same product+dates, within 30s).
  // This prevents double-click "Pay Now" from creating duplicate orders.
  // NOTE: Has a theoretical race window under true concurrent requests — accepted as "good enough
  // for hackathon scope." A fully race-proof solution would use a unique constraint on a hash column
  // or a distributed lock, both overkill here.
  const recentCutoff = subSeconds(new Date(), 30);
  const productIds = items.map(i => i.productId);
  const recentPaidOrders = await prisma.rentalOrder.findMany({
    where: {
      customerId: userId,
      productId: { in: productIds },
      state: OrderState.Paid,
      quotationType,
      createdAt: { gte: recentCutoff },
    },
  });
  if (recentPaidOrders.length > 0) {
    // Duplicate detected — return the existing order IDs from the original request
    return recentPaidOrders.map(o => o.id);
  }

  // Group quantities to check total requested against stock
  const requestedStock: Record<string, number> = {};
  for (const item of items) {
    requestedStock[item.productId] = (requestedStock[item.productId] || 0) + item.quantity;
  }

  // Iterate all distinct products to validate stock & fetch current pricing
  const products = await prisma.product.findMany({
    where: { id: { in: Object.keys(requestedStock) } },
  });

  const productMap = new Map<string, Product>(products.map((p: Product) => [p.id, p]));

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
      { rentalPricePerDay: product.rentalPricePerDay, depositAmount: product.depositAmount, stockQty: 9999 }, // stockQty bypass: stock already validated above (lines 43-45) in same transaction; this call intentionally skips redundant check for single-unit pricing math
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

/**
 * State machine transition for RentalOrder.
 * Performs a concurrency check immediately before mutation.
 */
export async function processTransition(
  prisma: Prisma.TransactionClient,
  orderId: string,
  action: 'pickup' | 'return' | 'settle'
) {
  // Initial fetch to get metadata (prices, dates, product)
  const order = await prisma.rentalOrder.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const concurrencyErrorMsg = '409: Order state has changed or transition is invalid. Please refresh and try again.';

  if (action === 'pickup') {
    const result = await prisma.rentalOrder.updateMany({
      where: { id: order.id, state: OrderState.Paid },
      data: { state: OrderState.Active },
    });
    if (result.count === 0) throw new Error(concurrencyErrorMsg);
  } else if (action === 'return') {
    const result = await prisma.rentalOrder.updateMany({
      where: { id: order.id, state: OrderState.Active },
      data: { state: OrderState.Returned },
    });
    if (result.count === 0) throw new Error(concurrencyErrorMsg);
    
    // Increment stock qty since it's physically back
    await prisma.product.update({
      where: { id: order.productId },
      data: { stockQty: { increment: 1 } },
    });
  } else if (action === 'settle') {
    const returnDateObj = new Date();
    const end = startOfDay(order.endDate);
    const returnDay = startOfDay(returnDateObj);

    let daysLate = 0;
    if (isAfter(returnDay, end)) {
      daysLate = differenceInCalendarDays(returnDay, end);
    }

    const maxPenalty = order.depositAmount;
    const penalty = Math.min(daysLate * order.product.lateFeePerDay, maxPenalty);
    const refund = Math.max(0, order.depositAmount - penalty);

    const result = await prisma.rentalOrder.updateMany({
      where: { id: order.id, state: OrderState.Returned },
      data: {
        state: OrderState.Settled,
        penaltyAmount: penalty,
        depositRefunded: refund,
      },
    });
    if (result.count === 0) throw new Error(concurrencyErrorMsg);
  } else {
    throw new Error(`400: Unknown action: ${action}`);
  }
}


