import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReactNode } from 'react';
import AnimatedCounter from './ui/AnimatedCounter';
import MiniChart, { MiniChartType } from './ui/MiniChart';

export default function DashboardWidget({
  label,
  value,
  color = 'text-foreground',
  icon,
  chartData,
  chartType = 'bar',
  formatPrefix = '',
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: ReactNode;
  chartData?: number[];
  chartType?: MiniChartType;
  formatPrefix?: string;
}) {
  const isNumeric = typeof value === 'number';
  // If it's a string that starts with something like "₹", extract the number part if possible, 
  // or just render it directly if we don't want to parse.
  // Actually, we can just pass the parsed number. We'll handle it outside.

  return (
    <Card className="overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </CardTitle>
        {icon && (
          <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-muted/50 group-hover:bg-background/80 transition-colors shadow-sm ${color}`}>
            <div className="h-5 w-5">{icon}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-3xl font-bold tracking-tight tabular-nums ${color}`}>
          {isNumeric ? (
            <AnimatedCounter value={value as number} formatPrefix={formatPrefix} />
          ) : (
            value
          )}
        </div>
      </CardContent>
      {chartData && chartData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 group-hover:opacity-20 transition-opacity z-0 pointer-events-none">
          <MiniChart data={chartData} type={chartType} color="currentColor" />
        </div>
      )}
    </Card>
  );
}
