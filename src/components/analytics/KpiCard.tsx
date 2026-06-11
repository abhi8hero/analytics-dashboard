import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number; // % change, optional
  suffix?: string;
  colorClass?: string;
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  suffix,
  colorClass = 'text-primary',
}: KpiCardProps) {
  const formatted =
    typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="bg-card border border-border rounded p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        <div className={cn('w-7 h-7 rounded flex items-center justify-center bg-muted', colorClass)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tabular-nums leading-none text-foreground roll-number">
          {formatted}
          {suffix && <span className="text-base font-normal text-muted-foreground ml-1">{suffix}</span>}
        </span>

        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium shrink-0',
              trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
