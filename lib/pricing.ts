import { differenceInHours } from 'date-fns';
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
  if (endDate <= startDate) {
    throw new Error('End date must be after start date');
  }
  
  if (quantity > product.stockQty) {
    throw new Error(`Requested quantity exceeds available stock (${product.stockQty})`);
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const hours = differenceInHours(endDate, startDate);
  // Round up to nearest billable day (e.g. 25 hours -> 2 days)
  // If the exact difference is less than 1 hour, differenceInHours is 0, so fallback to minimum 1 day.
  const billableDays = Math.max(1, Math.ceil(hours / 24));

  const rentalTotal = product.rentalPricePerDay * billableDays * quantity;
  const depositTotal = product.depositAmount * quantity;

  return {
    days: billableDays,
    rentalTotal,
    depositTotal,
    grandTotal: rentalTotal + depositTotal,
  };
}
