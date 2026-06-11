import { cn } from '@/lib/utils';

interface BarListProps {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  maxItems?: number;
  showPercentage?: boolean;
}

export default function BarList({
  title,
  data,
  maxItems = 8,
  showPercentage = false,
}: BarListProps) {
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="bg-card border border-border rounded p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h3>
      <div className="flex flex-col gap-2 flex-1">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No data yet</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 min-w-0">
            <span className="text-xs text-muted-foreground tabular-nums w-4 shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-foreground truncate max-w-[160px]">
                  {item.label}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground shrink-0 ml-2">
                  {showPercentage
                    ? `${Math.round((item.value / total) * 100)}%`
                    : item.value.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', item.color ?? 'bg-primary')}
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
