import { useEffect, useState } from 'react';
import {
  fetchCountryStats,
  fetchRegionStats,
  fetchCityStats,
} from '@/services/analyticsService';
import type { LocationStat, RegionStat, CityStat } from '@/types/types';
import BarList from '@/components/analytics/BarList';
import { Skeleton } from '@/components/ui/skeleton';

export default function GeographyPage() {
  const [countries, setCountries] = useState<LocationStat[]>([]);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCountryStats(30),
      fetchRegionStats(30),
      fetchCityStats(30),
    ]).then(([c, r, ci]) => {
      setCountries(c);
      setRegions(r);
      setCities(ci);
      setLoading(false);
    });
  }, []);

  if (loading) return <GeoSkeleton />;

  const CHART_COLORS = [
    'bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5',
  ];

  // Top country summary
  const totalVisits = countries.reduce((s, c) => s + c.visits, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Country distribution */}
      <div className="bg-card border border-border rounded p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          Visitors by Country
        </h3>
        {countries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No location data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4 whitespace-nowrap">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">Country</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2 pr-6 whitespace-nowrap">Visitors</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2 whitespace-nowrap">Share</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                    </td>
                    <td className="py-2.5 pr-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{flagEmoji(c.country_code)}</span>
                        <span className="text-sm text-foreground">{c.country}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-6 text-right whitespace-nowrap">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {c.visits.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {Math.round((c.visits / totalVisits) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regions & Cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div style={{ minHeight: 280 }}>
          <BarList
            title="Top Regions / States"
            data={regions.map((r, i) => ({
              label: r.region,
              value: r.visits,
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))}
          />
        </div>
        <div style={{ minHeight: 280 }}>
          <BarList
            title="Top Cities"
            data={cities.map((c, i) => ({
              label: c.city,
              value: c.visits,
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function flagEmoji(code: string | null) {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

function GeoSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded" />
        <Skeleton className="h-64 rounded" />
      </div>
    </div>
  );
}
