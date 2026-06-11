import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface DonutChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
}

export default function DonutChart({ title, data }: DonutChartProps) {
  return (
    <div className="bg-card border border-border rounded p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center flex-1 flex items-center justify-center">
          No data yet
        </p>
      ) : (
        <div className="flex-1 min-h-0" style={{ minHeight: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="65%"
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 12,
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(v: number) => [v.toLocaleString(), '']}
              />
              <Legend
                layout="horizontal"
                wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
