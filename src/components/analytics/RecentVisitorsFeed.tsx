import { formatDistanceToNow, parseISO } from 'date-fns';
import { Monitor, Smartphone, Tablet, Globe, RotateCcw } from 'lucide-react';
import type { RecentVisitor } from '@/types/types';
import { cn } from '@/lib/utils';

interface RecentVisitorsFeedProps {
  visitors: RecentVisitor[];
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (type === 'tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function truncateUrl(url: string) {
  try {
    const u = new URL(url);
    return u.pathname.length > 30 ? u.pathname.slice(0, 28) + '…' : u.pathname || '/';
  } catch {
    return url.length > 30 ? url.slice(0, 28) + '…' : url;
  }
}

export default function RecentVisitorsFeed({ visitors }: RecentVisitorsFeedProps) {
  return (
    <div className="bg-card border border-border rounded p-4 h-full flex flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        Recent Activity
      </h3>
      <div className="flex-1 overflow-y-auto space-y-0">
        {visitors.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent visitors
          </p>
        )}
        {visitors.map((v, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 min-w-0"
          >
            <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <DeviceIcon type={v.device_type} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground truncate">
                  {truncateUrl(v.page_url)}
                </span>
                {v.is_returning && (
                  <RotateCcw className="w-3 h-3 text-info shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {[v.city, v.country].filter(Boolean).join(', ') || 'Unknown'}
                </span>
                {v.browser && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground truncate">{v.browser}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {formatDistanceToNow(parseISO(v.viewed_at), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
