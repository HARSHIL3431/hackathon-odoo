'use client';

import React from 'react';
import { useCart } from './CartProvider';
import { format } from 'date-fns';

export default function CartSummary() {
  const { items, removeFromCart, cartTotal, cartDeposit } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Your cart is currently empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {items.map((item) => (
            <li key={item.id} className="p-6 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{item.product.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(item.startDate), 'MMM d, yyyy')} - {format(new Date(item.endDate), 'MMM d, yyyy')} ({item.days} days)
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">₹{item.rentalTotal}</p>
                <p className="text-xs text-gray-500">Deposit: ₹{item.depositTotal}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-sm font-medium text-red-600 hover:text-red-800 mt-2"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-4 mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Rental Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Refundable Deposit</span>
            <span>₹{cartDeposit}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
            <span>Grand Total</span>
            <span>₹{cartTotal + cartDeposit}</span>
          </div>
        </div>

        <div className="mt-8">
          <button className="w-full rounded-md bg-blue-600 py-3 px-4 text-white hover:bg-blue-700 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Proceed to Checkout
          </button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Checkout logic is implemented in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
}
