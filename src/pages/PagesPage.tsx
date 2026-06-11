import { useEffect, useState } from 'react';
import { fetchPageStats } from '@/services/analyticsService';
import type { PageStat } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

function truncatePath(url: string) {
  try { return new URL(url).pathname || '/'; } catch { return url; }
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageStats(30, 50).then((d) => { setPages(d); setLoading(false); });
  }, []);

  if (loading) return <PagesSkeleton />;

  const maxVisits = Math.max(...pages.map((p) => p.visits), 1);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          All Pages — Last 30 Days ({pages.length} pages)
        </h3>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No page view data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 whitespace-nowrap">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">Page</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">Total Views</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2 whitespace-nowrap">Unique Visitors</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    </td>
                    <td className="py-2.5 pr-6">
                      <div className="flex flex-col gap-1 min-w-0 max-w-xs">
                        <span className="text-sm text-foreground truncate font-medium">
                          {truncatePath(p.page_url)}
                        </span>
                        <div className="h-1 bg-muted rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(p.visits / maxVisits) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-6 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {p.visits.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {p.unique_visitors.toLocaleString()}
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

function PagesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-96 rounded" />
    </div>
  );
}
