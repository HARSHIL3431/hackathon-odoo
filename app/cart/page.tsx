import React from 'react';
import CartSummary from '@/components/CartSummary';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl py-8">
      <div className="mb-8 space-y-2">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your Cart</h1>
      </div>
      
      <CartSummary />
    </div>
  );
}
