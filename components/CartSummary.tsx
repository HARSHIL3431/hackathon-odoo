'use client';

import React from 'react';
import { useCart } from './CartProvider';
import { format } from 'date-fns';
import Link from 'next/link';
import { ShoppingCart, Trash2, CalendarDays, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CartSummary() {
  const { items, removeFromCart, cartTotal, cartDeposit } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
        <ShoppingCart className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Your cart is empty</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          Looks like you haven&apos;t added any equipment to your cart yet.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Browse Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{item.product.name}</h4>
                  <div className="mt-2 flex items-center text-sm text-muted-foreground gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {format(new Date(item.startDate), 'MMM d, yyyy')} - {format(new Date(item.endDate), 'MMM d, yyyy')} ({item.days} days)
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium">Qty: {item.quantity}</div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right ml-4">
                  <span className="text-xl font-bold">₹{item.rentalTotal}</span>
                  <span className="text-xs text-muted-foreground">Deposit: ₹{item.depositTotal}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 -mr-3 mt-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Card className="sticky top-20 bg-muted/30">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rental Subtotal</span>
              <span className="font-medium">₹{cartTotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Refundable Deposit</span>
              <span className="font-medium">₹{cartDeposit}</span>
            </div>
            <div className="flex justify-between border-t pt-4 text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">₹{cartTotal + cartDeposit}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full text-base">
              <Link href="/checkout">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
