import { OrderState } from '@prisma/client';
import { Badge } from './ui/Badge';
import { 
  FileEdit, 
  CheckCircle2, 
  CreditCard, 
  Package, 
  ShieldCheck, 
  Undo2, 
  AlertCircle,
  LucideIcon
} from 'lucide-react';

export default function OrderStatusBadge({ state }: { state: OrderState }) {
  const getBadgeProps = (): { variant: any, icon: LucideIcon, label: string } => {
    switch (state) {
      case OrderState.Draft:
        return { variant: 'secondary', icon: FileEdit, label: 'Draft' };
      case OrderState.Confirmed:
        return { variant: 'info', icon: CheckCircle2, label: 'Confirmed' };
      case OrderState.Paid:
        return { variant: 'info', icon: CreditCard, label: 'Paid' };
      case OrderState.PickedUp:
        return { variant: 'warning', icon: Package, label: 'Picked Up' };
      case OrderState.Active:
        return { variant: 'success', icon: ShieldCheck, label: 'Active' };
      case OrderState.Returned:
        return { variant: 'outline', icon: Undo2, label: 'Returned' };
      case OrderState.Settled:
        return { variant: 'default', icon: CheckCircle2, label: 'Settled' };
      default:
        return { variant: 'secondary', icon: FileEdit, label: state };
    }
  };

  const { variant, icon: Icon, label } = getBadgeProps();

  return (
    <Badge variant={variant} className="gap-1.5 py-1 px-2.5 font-medium whitespace-nowrap shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}
