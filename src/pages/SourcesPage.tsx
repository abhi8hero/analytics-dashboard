import { useEffect, useState } from 'react';
import { fetchReferrerStats } from '@/services/analyticsService';
import type { ReferrerStat } from '@/types/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const SOURCE_CATEGORIES: Record<string, string> = {
  'google.com': 'Search',
  'google.co.uk': 'Search',
  'google.co.in': 'Search',
  'bing.com': 'Search',
  'yahoo.com': 'Search',
  'duckduckgo.com': 'Search',
  'facebook.com': 'Social',
  'twitter.com': 'Social',
  'instagram.com': 'Social',
  'linkedin.com': 'Social',
  'reddit.com': 'Social',
  'news.ycombinator.com': 'Community',
  'hackernews.com': 'Community',
};

function getCategory(domain: string): string {
  return SOURCE_CATEGORIES[domain] ?? 'Referral';
}

export default function SourcesPage() {
  const [referrers, setReferrers] = useState<ReferrerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrerStats(30, 15).then((d) => { setReferrers(d); setLoading(false); });
  }, []);

  if (loading) return <SourcesSkeleton />;

  // Category aggregation
  const catMap: Record<string, number> = {};
  for (const r of referrers) {
    const cat = getCategory(r.referrer_domain);
    catMap[cat] = (catMap[cat] ?? 0) + r.visits;
  }
  const catData = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const maxVisits = Math.max(...referrers.map((r) => r.visits), 1);

  return (
    <div className="space-y-6">
      {/* Category chart */}
      <div className="bg-card border border-border rounded p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Traffic Source Categories
        </h3>
        {catData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No referrer data yet</p>
        ) : (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontSize: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="value" name="Visits" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Referrer table */}
      <div className="bg-card border border-border rounded p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Top Referring Domains
        </h3>
        {referrers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No referrer data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 whitespace-nowrap">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">Domain</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">Category</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2 whitespace-nowrap">Visits</th>
                </tr>
              </thead>
              <tbody>
                {referrers.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    </td>
                    <td className="py-2.5 pr-6">
                      <div className="flex flex-col gap-1 min-w-0 max-w-xs">
                        <span className="text-sm text-foreground font-medium truncate">
                          {r.referrer_domain}
                        </span>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-chart-2 rounded-full"
                            style={{ width: `${(r.visits / maxVisits) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-6 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {getCategory(r.referrer_domain)}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {r.visits.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SourcesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56 rounded" />
      <Skeleton className="h-72 rounded" />
    </div>
  );
}
