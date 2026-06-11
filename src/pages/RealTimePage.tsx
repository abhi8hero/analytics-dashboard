import { useEffect, useState, useCallback } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import RecentVisitorsFeed from '@/components/analytics/RecentVisitorsFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchRealTimeStats } from '@/services/analyticsService';
import type { RealTimeStats } from '@/types/types';

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (type === 'tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

export default function RealTimePage() {
  const [stats, setStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = useCallback(async () => {
    const data = await fetchRealTimeStats();
    setStats(data);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) return <RealTimeSkeleton />;

  return (
    <div className="space-y-6">
      {/* Live header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="realtime-dot shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Live Data</h2>
          <span className="text-xs text-muted-foreground">
            Auto-refreshes every 10 seconds
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      {/* Big live numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-6 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active Visitors
          </p>
          <p className="text-5xl font-bold tabular-nums text-foreground roll-number">
            {stats?.active_visitors ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">in the last 5 minutes</p>
        </div>
        <div className="bg-card border border-border rounded p-6 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active Sessions
          </p>
          <p className="text-5xl font-bold tabular-nums text-foreground roll-number">
            {stats?.active_sessions ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">in the last 30 minutes</p>
        </div>
      </div>

      {/* Active pages */}
      <div className="bg-card border border-border rounded p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Currently Active Pages
        </h3>
        {(stats?.active_pages ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active page views right now
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">
                    Page URL
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2 whitespace-nowrap">
                    Active Visitors
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats?.active_pages.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-6 whitespace-nowrap">
                      <span className="text-sm text-foreground tabular-nums">
                        {(() => { try { return new URL(p.page_url).pathname || '/'; } catch { return p.page_url; } })()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-realtime" />
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {p.active_count}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent visitors feed */}
      <div style={{ minHeight: 340 }}>
        <RecentVisitorsFeed visitors={stats?.recent_visitors ?? []} />
      </div>
    </div>
  );
}

function RealTimeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded" />
        <Skeleton className="h-32 rounded" />
      </div>
      <Skeleton className="h-48 rounded" />
      <Skeleton className="h-72 rounded" />
    </div>
  );
}
