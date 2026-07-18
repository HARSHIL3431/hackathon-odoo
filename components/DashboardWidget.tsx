import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReactNode } from 'react';

export default function DashboardWidget({
  label,
  value,
  color = 'text-foreground',
  icon,
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
