'use client';

import { useState } from 'react';
import { useCart, CartItem } from './CartProvider';
import { useRouter } from 'next/navigation';

export default function CheckoutForm() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  
  const [method, setMethod] = useState('Credit Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalAmount = items.reduce((sum: number, item: CartItem) => sum + item.rentalTotal, 0);
  const totalDeposit = items.reduce((sum: number, item: CartItem) => sum + item.depositTotal, 0);
  const grandTotal = totalAmount + totalDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Simulated payment failure for "Cash at Store" method
    if (method === 'Cash at Store') {
      setError('Payment failed: Cash at Store payments are not accepted online. Please choose another method.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item: CartItem) => ({
            productId: item.product.id,
            startDate: item.startDate,
            endDate: item.endDate,
            quantity: item.quantity
          })),
          method
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      // Success — clear cart and redirect
      clearCart();
      router.push('/orders');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during checkout.';
      setError(message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 mt-6">
        <p className="text-sm text-yellow-700">Your cart is empty. Please add items before checking out.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm max-w-2xl mx-auto">
      <h3 className="text-xl font-medium text-gray-900">Checkout</h3>
      
      {error && (
        <div className="rounded bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Order Summary</h4>
        <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
          {items.map((item: CartItem, idx: number) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.quantity}x {item.product.name} ({item.days} days)</span>
              <span>₹{item.rentalTotal + item.depositTotal}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Rental</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Deposit</span>
            <span>₹{totalDeposit}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-gray-200">
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
          disabled={loading}
        >
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="UPI">UPI</option>
          <option value="Cash at Store">Cash at Store (will fail — demo)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 py-3 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed text-lg font-medium transition flex justify-center items-center"
      >
        {loading ? (
          <span className="animate-pulse">Processing Payment...</span>
        ) : (
          `Pay ₹${grandTotal} Now`
        )}
      </button>
    </form>
  );
}
