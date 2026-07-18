import React from 'react';
import CartSummary from '@/components/CartSummary';
import Link from 'next/link';

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
        <div className="mt-2">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
      
      <CartSummary />
    </div>
  );
}
