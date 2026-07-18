'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderState } from '@prisma/client';

export function TransitionButtons({ orderId, currentState }: { orderId: string, currentState: OrderState }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransition = async (action: 'pickup' | 'return' | 'settle') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Transition failed');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (currentState === OrderState.Draft || currentState === OrderState.Confirmed) {
    return <p className="text-slate-500 text-sm">Waiting for customer payment.</p>;
  }

  if (currentState === OrderState.Settled) {
    return <p className="text-slate-500 text-sm">This order is fully settled.</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex gap-4">
        {currentState === OrderState.Paid && (
          <button
            onClick={() => handleTransition('pickup')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm Pickup
          </button>
        )}

        {currentState === OrderState.Active && (
          <button
            onClick={() => handleTransition('return')}
            disabled={loading}
            className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            Process Return
          </button>
        )}

        {currentState === OrderState.Returned && (
          <button
            onClick={() => handleTransition('settle')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Calculate & Settle Deposit
          </button>
        )}
      </div>
    </div>
  );
}
