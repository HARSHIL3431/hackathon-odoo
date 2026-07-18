import { OrderState } from '@prisma/client';

export default function OrderStatusBadge({ state }: { state: OrderState }) {
  const colors: Record<OrderState, string> = {
    Draft: 'bg-gray-100 text-gray-800',
    Confirmed: 'bg-blue-100 text-blue-800',
    Paid: 'bg-indigo-100 text-indigo-800',
    PickedUp: 'bg-yellow-100 text-yellow-800',
    Active: 'bg-green-100 text-green-800',
    Returned: 'bg-orange-100 text-orange-800',
    Settled: 'bg-purple-100 text-purple-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[state]}`}
    >
      {state}
    </span>
  );
}
