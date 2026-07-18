import { OrderState } from '@prisma/client';
import { Badge } from '@/components/ui/Badge';

export default function OrderStatusBadge({ state }: { state: OrderState }) {
  // Map OrderState to Badge variants
  const getVariant = (state: OrderState) => {
    switch (state) {
      case 'Draft':
        return 'secondary';
      case 'Confirmed':
      case 'Paid':
        return 'default';
      case 'PickedUp':
      case 'Active':
        return 'success';
      case 'Returned':
        return 'warning';
      case 'Settled':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant(state)}>
      {state}
    </Badge>
  );
}
