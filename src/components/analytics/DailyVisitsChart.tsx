import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { DailyVisit } from '@/types/types';
import { format, parseISO } from 'date-fns';

interface DailyChartProps {
  data: DailyVisit[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-foreground mb-1">
        {label ? (() => { try { return format(parseISO(label), 'MMM d, yyyy'); } catch { return label; } })() : ''}
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="tabular-nums font-medium text-foreground">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function DailyVisitsChart({ data }: DailyChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date,
    displayDate: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <div className="bg-card border border-border rounded p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        Daily Traffic (Last 30 Days)
      </h3>
      <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tickFormatter={(val: string) => { try { return format(parseISO(val), 'MMM d'); } catch { return val; } }}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="horizontal"
              wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="visits"
              name="Page Views"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="unique_visitors"
              name="Unique Visitors"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
