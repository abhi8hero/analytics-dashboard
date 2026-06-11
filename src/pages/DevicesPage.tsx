import { useEffect, useState } from 'react';
import { fetchDeviceStats, fetchBrowserStats, fetchOSStats } from '@/services/analyticsService';
import type { DeviceStat, BrowserStat, OSStat } from '@/types/types';
import DonutChart from '@/components/analytics/DonutChart';
import BarList from '@/components/analytics/BarList';
import { Skeleton } from '@/components/ui/skeleton';

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceStat[]>([]);
  const [browsers, setBrowsers] = useState<BrowserStat[]>([]);
  const [os, setOs] = useState<OSStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDeviceStats(30),
      fetchBrowserStats(30),
      fetchOSStats(30),
    ]).then(([d, b, o]) => {
      setDevices(d);
      setBrowsers(b);
      setOs(o);
      setLoading(false);
    });
  }, []);

  if (loading) return <DevicesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Device type donut + bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div style={{ minHeight: 260 }}>
          <DonutChart
            title="Device Types"
            data={devices.map((d) => ({ name: d.device_type, value: d.count }))}
          />
        </div>
        <div style={{ minHeight: 260 }}>
          <BarList
            title="Device Breakdown"
            data={devices.map((d) => ({
              label: d.device_type,
              value: d.count,
            }))}
            showPercentage
          />
        </div>
      </div>

      {/* Browser + OS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div style={{ minHeight: 280 }}>
          <BarList
            title="Browser Distribution"
            data={browsers.map((b) => ({ label: b.browser, value: b.count }))}
          />
        </div>
        <div style={{ minHeight: 280 }}>
          <BarList
            title="Operating Systems"
            data={os.map((o) => ({ label: o.os, value: o.count }))}
          />
        </div>
      </div>
    </div>
  );
}

function DevicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded" />
        <Skeleton className="h-64 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded" />
        <Skeleton className="h-64 rounded" />
      </div>
    </div>
  );
}
