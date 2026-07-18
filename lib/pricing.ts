import { differenceInDays, startOfDay } from 'date-fns';
import { Product } from '@prisma/client';

export type PricingResult = {
  days: number;
  rentalTotal: number;
  depositTotal: number;
  grandTotal: number;
};

export function calculateRentalPrice(
  product: Pick<Product, 'rentalPricePerDay' | 'depositAmount' | 'stockQty'>,
  startDate: Date,
  endDate: Date,
  quantity: number = 1
): PricingResult {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (end < start) {
    throw new Error('End date cannot be before start date');
  }
  
  if (quantity > product.stockQty) {
    throw new Error(`Requested quantity exceeds available stock (${product.stockQty})`);
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  // Count partial days / same day as 1 full day
  const days = Math.max(1, differenceInDays(end, start));

  const rentalTotal = product.rentalPricePerDay * days * quantity;
  const depositTotal = product.depositAmount * quantity;

  return {
    days,
    rentalTotal,
    depositTotal,
    grandTotal: rentalTotal + depositTotal,
  };
}
