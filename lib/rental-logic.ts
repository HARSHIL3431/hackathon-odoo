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
    return recentPaidOrders.map(o => o.id);
  }

  const requestedStock: Record<string, number> = {};
  for (const item of items) {
    requestedStock[item.productId] = (requestedStock[item.productId] || 0) + item.quantity;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: Object.keys(requestedStock) } },
  });
  const productMap = new Map<string, Product>(products.map((p: Product) => [p.id, p]));

  // Availability Engine
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (!product.isActive) throw new Error(`Product is currently inactive: ${product.name}`);

    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const now = new Date();

    if (start < now) {
      throw new Error(`Start time cannot be in the past for ${product.name}`);
    }
    if (end <= start) {
      throw new Error(`End time must be after start time for ${product.name}`);
    }

    const overlappingOrders = await prisma.rentalOrder.findMany({
      where: {
        productId: product.id,
        state: {
          in: [OrderState.Confirmed, OrderState.Paid, OrderState.PickedUp, OrderState.Active]
        },
        startDate: { lt: end },
        endDate: { gt: start },
      }
    });

    const reservedQuantity = overlappingOrders.reduce((sum, order) => sum + order.quantity, 0);
    const availableStock = product.stockQty - reservedQuantity;

    if (requestedStock[item.productId] > availableStock) {
      throw new Error(`Insufficient availability for ${product.name}. Requested: ${requestedStock[item.productId]}, Available for these dates: ${availableStock}`);
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


