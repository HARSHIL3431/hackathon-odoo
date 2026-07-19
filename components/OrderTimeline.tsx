import React from 'react';
import { OrderState } from '@prisma/client';
import { CheckCircle2, Circle, ArrowDown, Package, CreditCard, CalendarDays, ShieldCheck, Undo2, CheckSquare } from 'lucide-react';

const TIMELINE_STEPS = [
  { state: OrderState.Draft, label: 'Order Created', icon: CalendarDays },
  { state: OrderState.Confirmed, label: 'Confirmed', icon: CheckSquare },
  { state: OrderState.Paid, label: 'Paid', icon: CreditCard },
  // Wait, there is no "Ready for Pickup" state, it is inferred when state is Paid.
  { state: OrderState.PickedUp, label: 'Picked Up', icon: Package },
  { state: OrderState.Active, label: 'Active', icon: ShieldCheck },
  { state: OrderState.Returned, label: 'Returned', icon: Undo2 },
  { state: OrderState.Settled, label: 'Settled', icon: CheckCircle2 },
];

export default function OrderTimeline({ currentState }: { currentState: OrderState }) {
  const currentIndex = TIMELINE_STEPS.findIndex(step => step.state === currentState);
  
  return (
    <div className="relative py-4">
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border z-0"></div>
      
      <div className="space-y-6 relative z-10">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          
          const Icon = step.icon;
          
          let colorClass = 'text-muted-foreground bg-background border-border';
          let textColor = 'text-muted-foreground';
          
          if (isCompleted) {
            colorClass = 'text-primary bg-primary/10 border-primary shadow-sm';
            textColor = 'text-foreground';
          } else if (isCurrent) {
            colorClass = 'text-white bg-primary border-primary shadow-md ring-4 ring-primary/20';
            textColor = 'text-primary font-semibold';
          }
          
          return (
            <div key={step.state} className="flex items-center gap-4 group">
              <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${colorClass}`}>
                <Icon className={`h-5 w-5 ${isCurrent ? 'animate-pulse' : ''}`} />
              </div>
              <div className={`flex flex-col transition-colors duration-300 ${textColor}`}>
                <span className="text-sm md:text-base">{step.label}</span>
                {isCurrent && <span className="text-xs opacity-80 mt-0.5">Current Status</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
