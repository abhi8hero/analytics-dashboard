import { useEffect, useState, useCallback } from 'react';
import { Users, Eye, BarChart2, Repeat } from 'lucide-react';
import KpiCard from '@/components/analytics/KpiCard';
import DailyVisitsChart from '@/components/analytics/DailyVisitsChart';
import BarList from '@/components/analytics/BarList';
import RecentVisitorsFeed from '@/components/analytics/RecentVisitorsFeed';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchOverviewStats,
  fetchDailyVisits,
  fetchPageStats,
  fetchRealTimeStats,
} from '@/services/analyticsService';
import type {
  OverviewStats,
  DailyVisit,
  PageStat,
  RealTimeStats,
} from '@/types/types';

export default function OverviewPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [daily, setDaily] = useState<DailyVisit[]>([]);
  const [pages, setPages] = useState<PageStat[]>([]);
  const [realtime, setRealtime] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [o, d, p, rt] = await Promise.all([
      fetchOverviewStats(30),
      fetchDailyVisits(30),
      fetchPageStats(30, 8),
      fetchRealTimeStats(),
    ]);
    setOverview(o);
    setDaily(d);
    setPages(p);
    setRealtime(rt);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) return <OverviewSkeleton />;

  return (
    <div className="space-y-6">
      {/* Real-time pulse bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border rounded">
        <span className="realtime-dot shrink-0" />
        <span className="text-sm font-medium text-foreground tabular-nums">
          {realtime?.active_visitors ?? 0}
        </span>
        <span className="text-sm text-muted-foreground">visitors active right now</span>
        <span className="mx-1 text-muted-foreground/40">·</span>
        <span className="text-sm font-medium text-foreground tabular-nums">
          {realtime?.active_sessions ?? 0}
        </span>
        <span className="text-sm text-muted-foreground">active sessions</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Visits"
          value={overview?.total_visits ?? 0}
          icon={Eye}
          colorClass="text-primary"
        />
        <KpiCard
          title="Unique Visitors"
          value={overview?.unique_visitors ?? 0}
          icon={Users}
          colorClass="text-info"
        />
        <KpiCard
          title="Total Sessions"
          value={overview?.total_sessions ?? 0}
          icon={BarChart2}
          colorClass="text-success"
        />
        <KpiCard
          title="Returning Visitors"
          value={overview?.returning_visitors ?? 0}
          icon={Repeat}
          colorClass="text-warning"
        />
      </div>

      {/* Daily chart */}
      <div style={{ height: 280 }}>
        <DailyVisitsChart data={daily} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div style={{ minHeight: 300 }}>
          <BarList
            title="Top Pages (Last 30 Days)"
            data={pages.map((p) => ({
              label: (() => {
                try { return new URL(p.page_url).pathname || '/'; } catch { return p.page_url; }
              })(),
              value: p.visits,
            }))}
          />
        </div>
        <div style={{ minHeight: 300 }}>
          <RecentVisitorsFeed visitors={realtime?.recent_visitors ?? []} />
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded" />)}
      </div>
      <Skeleton className="h-[280px] rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded" />
        <Skeleton className="h-72 rounded" />
      </div>
    </div>
  );
}
