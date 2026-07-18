'use client';

import { useState } from 'react';
import { useCart, CartItem } from './CartProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CreditCard, AlertCircle, ShoppingBag } from 'lucide-react';

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
      const message = err instanceof Error ? (err instanceof Error ? err.message : String(err)) : 'An error occurred during checkout.';
      setError(message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-muted/50">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Please add items to your cart before proceeding to checkout.
        </p>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Payment Details</CardTitle>
        <CardDescription>All transactions are secure and encrypted.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-lg bg-muted/50 p-6 border">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order Summary</h4>
            <div className="space-y-3 divide-y divide-border">
              {items.map((item: CartItem, idx: number) => (
                <div key={idx} className="flex justify-between text-sm pt-3 first:pt-0 border-0">
                  <span className="font-medium">{item.quantity}x {item.product.name} <span className="text-muted-foreground font-normal">({item.days} days)</span></span>
                  <span>₹{item.rentalTotal + item.depositTotal}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 text-sm pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rental</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deposit</span>
                <span>₹{totalDeposit}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 mt-4 border-t">
                <span>Grand Total</span>
                <span className="text-primary">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium leading-none">Payment Method</label>
            <div className="relative">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="Cash at Store">Cash at Store (will fail)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="bg-muted/20 border-t pt-6">
        <Button
          type="submit"
          form="checkout-form"
          disabled={loading}
          size="lg"
          className="w-full text-base"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent"></span>
              Processing Payment...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay ₹{grandTotal}
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
