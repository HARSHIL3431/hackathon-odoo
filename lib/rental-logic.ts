import { OrderState, Prisma, QuotationType, Product } from '@prisma/client';
import { calculateRentalPrice } from './pricing';
import { subSeconds, differenceInHours } from 'date-fns';

export interface CheckoutItem {
  productId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  quantity: number;
}

/**
 * Validates availability using a dynamic Overlap Engine, calculates pricing securely,
 * and creates RentalOrder/Payment rows in a single atomic transaction.
 */
export async function processCheckout(
  prisma: Prisma.TransactionClient,
  userId: string,
  items: CheckoutItem[],
  method: string,
  quotationType: QuotationType = QuotationType.ONLINE
): Promise<string[]> {
  const createdOrderIds: string[] = [];

  // Idempotency: check if an identical cart was processed for this user within the last 30 seconds
  const recentCutoff = subSeconds(new Date(), 30);
  const recentOrders = await prisma.rentalOrder.findMany({
    where: {
      customerId: userId,
      state: OrderState.Paid,
      quotationType,
      createdAt: { gte: recentCutoff },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOrders.length > 0) {
    // Group recent orders by time proximity (created within 2 seconds of each other) to identify unique checkout transactions
    const checkoutGroups: any[][] = [];
    const sortedRecent = [...recentOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const order of sortedRecent) {
      let added = false;
      for (const group of checkoutGroups) {
        if (Math.abs(order.createdAt.getTime() - group[0].createdAt.getTime()) < 2000) {
          group.push(order);
          added = true;
          break;
        }
      }
      if (!added) {
        checkoutGroups.push([order]);
      }
    }

    const normalizedCartSignature = items
      .map(i => `${i.productId}|${new Date(i.startDate).toISOString()}|${new Date(i.endDate).toISOString()}|${i.quantity}`)
      .sort()
      .join(';;');

    for (const group of checkoutGroups) {
      if (group.length === items.length) {
        const recentSignature = group
          .map(o => `${o.productId}|${o.startDate.toISOString()}|${o.endDate.toISOString()}|${o.quantity}`)
          .sort()
          .join(';;');
        if (recentSignature === normalizedCartSignature) {
          return group.map(o => o.id);
        }
      }
    }
  }

  const productIds = [...new Set(items.map(i => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map<string, Product>(products.map((p: Product) => [p.id, p]));

  // Availability Engine — group requested quantities by (productId + startDate + endDate) to avoid false-positive sum of non-overlapping bookings
  const groupedRequested: Record<string, { productId: string, startDate: Date, endDate: Date, quantity: number }> = {};
  for (const item of items) {
    const startIso = new Date(item.startDate).toISOString();
    const endIso = new Date(item.endDate).toISOString();
    const key = `${item.productId}_${startIso}_${endIso}`;
    if (!groupedRequested[key]) {
      groupedRequested[key] = {
        productId: item.productId,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        quantity: 0
      };
    }
    groupedRequested[key].quantity += item.quantity;
  }

  const now = new Date();
  for (const group of Object.values(groupedRequested)) {
    const product = productMap.get(group.productId);
    if (!product) throw new Error(`Product not found: ${group.productId}`);
    if (!product.isActive) throw new Error(`Product is currently inactive: ${product.name}`);

    if (group.startDate < now) {
      throw new Error(`Start time cannot be in the past for ${product.name}`);
    }
    if (group.endDate <= group.startDate) {
      throw new Error(`End time must be after start time for ${product.name}`);
    }

    const overlappingOrders = await prisma.rentalOrder.findMany({
      where: {
        productId: product.id,
        state: {
          in: [OrderState.Confirmed, OrderState.Paid, OrderState.PickedUp, OrderState.Active]
        },
        startDate: { lt: group.endDate },
        endDate: { gt: group.startDate },
      }
    });

    const reservedQuantity = overlappingOrders.reduce((sum, order) => sum + order.quantity, 0);
    const availableStock = product.stockQty - reservedQuantity;

    if (group.quantity > availableStock) {
      throw new Error(`Insufficient availability for ${product.name}. Requested: ${group.quantity}, Available for these dates: ${availableStock}`);
    }
  }

  // Process inside the transaction
  for (const item of items) {
    const product = productMap.get(item.productId)!;

    // We no longer decrement stockQty, as availability is now dynamically computed!

    const pricing = calculateRentalPrice(
      { rentalPricePerDay: product.rentalPricePerDay, depositAmount: product.depositAmount, stockQty: 9999 }, // Bypass stock check for single-unit pricing math
      new Date(item.startDate),
      new Date(item.endDate),
      item.quantity
    );

    const order = await prisma.rentalOrder.create({
      data: {
        customerId: userId,
        productId: product.id,
        quantity: item.quantity,
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

    await prisma.rentalOrder.update({
      where: { id: order.id },
      data: { state: OrderState.Confirmed },
    });

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

  return createdOrderIds;
}

export async function processTransition(
  prisma: Prisma.TransactionClient,
  orderId: string,
  action: 'pickup' | 'return' | 'settle'
) {
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

    // No longer incrementing physical stock, dynamically calculated!
  } else if (action === 'settle') {
    const returnDateObj = new Date();
    const expectedEnd = new Date(order.endDate);

    let lateDays = 0;
    if (returnDateObj > expectedEnd) {
      const lateHours = Math.max(0, differenceInHours(returnDateObj, expectedEnd));
      lateDays = Math.ceil(lateHours / 24);
    }

    const maxPenalty = order.depositAmount;
    const penalty = Math.min(lateDays * order.product.lateFeePerDay, maxPenalty);
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


