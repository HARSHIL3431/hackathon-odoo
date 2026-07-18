'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@prisma/client';
import { calculateRentalPrice, PricingResult } from '@/lib/pricing';
import { useCart } from './CartProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShoppingCart, CalendarDays } from 'lucide-react';

export default function AddToCartForm({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState<PricingResult | null>(null);

  const isCompleteDate = (value: string) => {
    if (!value) return false;
    const parts = value.split('-');
    if (parts.length !== 3) return false;
    const yearStr = parts[0];
    return yearStr.length === 4 && yearStr[0] !== '0';
  };

  const getCombinedDateTime = (dateStr: string, timeStr: string): Date | null => {
    if (!isCompleteDate(dateStr) || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}:00`);
  };

  const validate = (forceValidation: boolean = false) => {
    if (!startDate || !startTime || !endDate || !endTime || quantity === '' || quantity <= 0) {
      setPricing(null);
      setError('');
      return false;
    }

    const start = getCombinedDateTime(startDate, startTime);
    const end = getCombinedDateTime(endDate, endTime);

    // While typing, if either date/time isn't fully complete, delay validation
    if (!forceValidation && (!start || !end)) {
      setPricing(null);
      setError('');
      return false;
    }

    if (!start || !end) {
      setError('Please complete all date and time selections.');
      setPricing(null);
      return false;
    }

    try {
      const result = calculateRentalPrice(
        { rentalPricePerDay: product.rentalPricePerDay, depositAmount: product.depositAmount, stockQty: product.stockQty },
        start,
        end,
        quantity as number
      );
      setPricing(result);
      setError('');
      return true;
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Invalid selection');
      setPricing(null);
      return false;
    }
  };

  useEffect(() => {
    validate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, startTime, endDate, endTime, quantity, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validate(true);
    if (!isValid || quantity === '') return;

    const start = getCombinedDateTime(startDate, startTime)!;
    const end = getCombinedDateTime(endDate, endTime)!;

    addToCart({
      product,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      quantity: quantity as number,
      days: pricing!.days, // This now actually means billable days based on hourly calculation
      rentalTotal: pricing!.rentalTotal,
      depositTotal: pricing!.depositTotal,
    });
    
    router.push('/cart');
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarDays className="h-5 w-5 text-primary" />
          Rental Options
        </CardTitle>
        <CardDescription>Select your exact dates, times, and quantity to proceed.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => validate(true)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onBlur={() => validate(true)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={() => validate(true)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                onBlur={() => validate(true)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Quantity (Available: {product.stockQty})</label>
            <Input
              type="number"
              min="1"
              max={product.stockQty}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                setQuantity(val === '' ? '' : parseInt(val, 10));
              }}
              required
            />
          </div>

          {pricing && (
            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Billable Duration</span>
                <span className="font-medium">{pricing.days} day(s)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Rental Cost (₹{product.rentalPricePerDay} × {pricing.days} × {quantity})</span>
                <span className="font-medium">₹{pricing.rentalTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Refundable Deposit</span>
                <span className="font-medium">₹{pricing.depositTotal}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t font-bold text-lg">
                <span>Total Upfront</span>
                <span className="text-primary">₹{pricing.grandTotal}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full text-base"
            disabled={!!error || !pricing}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
