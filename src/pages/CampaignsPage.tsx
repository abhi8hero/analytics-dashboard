import { useEffect, useState, useCallback } from 'react';
import { Tag, Share2, Layers, Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchCampaignStats,
  fetchUtmSourceStats,
  fetchUtmMediumStats,
  fetchRefStats,
} from '@/services/analyticsService';
import { useSite } from '@/context/SiteContext';
import type { CampaignStat, UtmSourceStat, UtmMediumStat, RefStat } from '@/types/types';

// ── Colour badge per medium ───────────────────────────────────────────────────
const MEDIUM_COLORS: Record<string, string> = {
  email:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  cpc:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  social:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  organic: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  referral:'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};
function mediumClass(m: string | null) {
  return MEDIUM_COLORS[(m ?? '').toLowerCase()] ?? 'bg-muted text-muted-foreground';
}

// ── Reusable ranked bar list ──────────────────────────────────────────────────
function RankedList({ items, label }: { items: { name: string; visits: number }[]; label: string }) {
  const max = items[0]?.visits || 1;
  if (items.length === 0) return (
    <p className="text-sm text-muted-foreground py-6 text-center">No {label} data yet</p>
  );
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3 min-w-0">
          <span className="text-xs tabular-nums text-muted-foreground w-4 shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground shrink-0">{item.visits.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.round((item.visits / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── UTM Guide card ────────────────────────────────────────────────────────────
function UtmGuide() {
  return (
    <div className="bg-card border border-border rounded p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-foreground">How to tag your links</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Add UTM parameters to any URL you share. The tracker captures them automatically —
        no code changes needed on your website.
      </p>

      <div className="space-y-3">
        {[
          {
            label: 'Newsletter',
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            url: 'https://yoursite.com/?utm_source=newsletter&utm_medium=email&utm_campaign=june_launch',
          },
          {
            label: 'Twitter / X',
            color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
            url: 'https://yoursite.com/?utm_source=twitter&utm_medium=social&utm_campaign=product_post',
          },
          {
            label: 'Google Ads',
            color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
            url: 'https://yoursite.com/?utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_term=my+brand',
          },
          {
            label: 'Simple ref',
            color: 'bg-muted text-muted-foreground',
            url: 'https://yoursite.com/?ref=partner_blog',
          },
        ].map((ex) => (
          <div key={ex.label} className="space-y-1">
            <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${ex.color}`}>
              {ex.label}
            </span>
            <p className="text-[11px] text-muted-foreground font-mono break-all leading-relaxed bg-muted/50 rounded px-2 py-1.5">
              {ex.url}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground font-semibold mb-1.5">Parameter reference</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            ['utm_source', 'WHERE (google, twitter)'],
            ['utm_medium', 'HOW (email, cpc, social)'],
            ['utm_campaign', 'WHICH campaign name'],
            ['utm_term', 'Keyword (paid search)'],
            ['utm_content', 'A/B variant label'],
            ['ref', 'Simple shorthand tag'],
          ].map(([param, desc]) => (
            <div key={param} className="flex flex-col">
              <span className="text-[11px] font-mono text-primary">{param}</span>
              <span className="text-[10px] text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const { siteFilter } = useSite();
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
  const [sources, setSources] = useState<UtmSourceStat[]>([]);
  const [mediums, setMediums] = useState<UtmMediumStat[]>([]);
  const [refs, setRefs] = useState<RefStat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, s, m, r] = await Promise.all([
      fetchCampaignStats(30, siteFilter),
      fetchUtmSourceStats(30, siteFilter),
      fetchUtmMediumStats(30, siteFilter),
      fetchRefStats(30, siteFilter),
    ]);
    setCampaigns(c);
    setSources(s);
    setMediums(m);
    setRefs(r);
    setLoading(false);
  }, [siteFilter]);

  useEffect(() => { load(); }, [load]);

  const totalTagged = campaigns.reduce((s, c) => s + c.visits, 0)
    + refs.reduce((s, r) => s + r.visits, 0);

  if (loading) return <CampaignsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Tag,    label: 'Campaigns',    value: campaigns.length },
          { icon: Share2, label: 'Sources',      value: sources.length },
          { icon: Layers, label: 'Mediums',      value: mediums.length },
          { icon: Hash,   label: 'Tagged visits',value: totalTagged },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded p-4 flex flex-col gap-1 h-full">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaigns table */}
        <div className="bg-card border border-border rounded p-4 md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Campaigns (utm_campaign)
          </h3>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No campaign data yet — tag your links with <code className="bg-muted px-1 rounded">utm_campaign</code> to see them here
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border">
                    {['Campaign', 'Source', 'Medium', 'Visits', 'Unique'].map((h, i) => (
                      <th key={h} className={`text-xs font-medium text-muted-foreground pb-2 whitespace-nowrap ${i > 0 ? 'text-right pl-6' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4">
                        <span className="text-sm font-medium text-foreground">{c.utm_campaign}</span>
                      </td>
                      <td className="py-2.5 pl-6 text-right whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">{c.utm_source ?? '—'}</span>
                      </td>
                      <td className="py-2.5 pl-6 text-right whitespace-nowrap">
                        {c.utm_medium ? (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${mediumClass(c.utm_medium)}`}>
                            {c.utm_medium}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 pl-6 text-right whitespace-nowrap">
                        <span className="text-sm font-semibold tabular-nums text-foreground">{c.visits.toLocaleString()}</span>
                      </td>
                      <td className="py-2.5 pl-6 text-right whitespace-nowrap">
                        <span className="text-sm tabular-nums text-muted-foreground">{c.unique_visitors.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-card border border-border rounded p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Sources (utm_source)
          </h3>
          <RankedList items={sources.map((s) => ({ name: s.utm_source, visits: s.visits }))} label="source" />
        </div>

        {/* Mediums */}
        <div className="bg-card border border-border rounded p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Mediums (utm_medium)
          </h3>
          <RankedList items={mediums.map((m) => ({ name: m.utm_medium, visits: m.visits }))} label="medium" />
        </div>

        {/* Ref tags */}
        <div className="bg-card border border-border rounded p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Ref Tags (?ref=…)
          </h3>
          <RankedList items={refs.map((r) => ({ name: r.ref_param, visits: r.visits }))} label="ref tag" />
        </div>

        {/* UTM guide */}
        <div className="md:col-span-1">
          <UtmGuide />
        </div>
      </div>
    </div>
  );
}

function CampaignsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded" />)}
      </div>
      <Skeleton className="h-64 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded" />)}
      </div>
    </div>
  );
}
