'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import { calculateRentalPrice, PricingResult } from '@/lib/pricing';
import { useCart } from './CartProvider';
import { useRouter } from 'next/navigation';

export default function AddToCartForm({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState<PricingResult | null>(null);

  useEffect(() => {
    if (!startDate || !endDate || quantity <= 0) {
      setPricing(null);
      setError('');
      return;
    }

    try {
      const result = calculateRentalPrice(
        { rentalPricePerDay: product.rentalPricePerDay, depositAmount: product.depositAmount, stockQty: product.stockQty },
        new Date(startDate),
        new Date(endDate),
        quantity
      );
      setPricing(result);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid selection');
      setPricing(null);
    }
  }, [startDate, endDate, quantity, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error || !pricing) return;

    addToCart({
      product,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      quantity,
      days: pricing.days,
      rentalTotal: pricing.rentalTotal,
      depositTotal: pricing.depositTotal,
    });
    
    router.push('/cart');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900">Rental Options</h3>
      
      {error && (
        <div className="rounded bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity (Available: {product.stockQty})</label>
        <input
          type="number"
          min="1"
          max={product.stockQty}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      {pricing && (
        <div className="rounded-md bg-gray-50 p-4 space-y-2 text-sm text-gray-800 border border-gray-200">
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{pricing.days} day(s)</span>
          </div>
          <div className="flex justify-between">
            <span>Rental Cost (₹{product.rentalPricePerDay} × {pricing.days} × {quantity}):</span>
            <span>₹{pricing.rentalTotal}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Refundable Deposit (₹{product.depositAmount} × {quantity}):</span>
            <span>₹{pricing.depositTotal}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
            <span>Grand Total:</span>
            <span>₹{pricing.grandTotal}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!!error || !pricing}
        className="w-full rounded-md bg-blue-600 py-3 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed text-lg font-medium transition"
      >
        Add to Cart
      </button>
    </form>
  );
}
