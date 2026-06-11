import { supabase } from '@/db/supabase';
import type {
  OverviewStats,
  DailyVisit,
  PageStat,
  LocationStat,
  RegionStat,
  CityStat,
  DeviceStat,
  BrowserStat,
  OSStat,
  ReferrerStat,
  RealTimeStats,
  CampaignStat,
  UtmSourceStat,
  UtmMediumStat,
  RefStat,
} from '@/types/types';

// Helper: apply optional site_domain filter to a Supabase query builder
function withSite<T>(query: T, siteDomain: string | null): T {
  if (siteDomain) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (query as any).eq('site_domain', siteDomain) as T;
  }
  return query;
}

// ─── Overview Stats ───────────────────────────────────────────────────────────

export async function fetchOverviewStats(days = 30, siteDomain: string | null = null): Promise<OverviewStats> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let pvQuery = supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);

  let sessQuery = supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('started_at', since);
  sessQuery = withSite(sessQuery, siteDomain);

  const [visitsRes, sessionsRes] = await Promise.all([pvQuery, sessQuery]);

  // Unique visitors: get visitor_ids from filtered page_views
  let uvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  uvQuery = withSite(uvQuery, siteDomain);
  const { data: uvData } = await uvQuery;
  const uniqueVisitors = new Set((uvData ?? []).map((r) => r.visitor_id)).size;

  // Returning visitors from that unique set
  const visitorIds = [...new Set((uvData ?? []).map((r) => r.visitor_id))];
  let returningCount = 0;
  if (visitorIds.length > 0) {
    const { count } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true })
      .in('id', visitorIds)
      .eq('is_returning', true);
    returningCount = count ?? 0;
  }

  return {
    total_visits: visitsRes.count ?? 0,
    unique_visitors: uniqueVisitors,
    total_sessions: sessionsRes.count ?? 0,
    returning_visitors: returningCount,
  };
}

// ─── Daily Visits ─────────────────────────────────────────────────────────────

export async function fetchDailyVisits(days = 30, siteDomain: string | null = null): Promise<DailyVisit[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase.from('page_views').select('viewed_at, visitor_id').gte('viewed_at', since).order('viewed_at', { ascending: true });
  query = withSite(query, siteDomain);
  const { data } = await query;

  if (!data) return [];

  const byDay: Record<string, { visits: number; visitors: Set<string> }> = {};
  for (const row of data) {
    const date = row.viewed_at.slice(0, 10);
    if (!byDay[date]) byDay[date] = { visits: 0, visitors: new Set() };
    byDay[date].visits++;
    byDay[date].visitors.add(row.visitor_id);
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      visits: v.visits,
      unique_visitors: v.visitors.size,
    }));
}

// ─── Page Analytics ───────────────────────────────────────────────────────────

export async function fetchPageStats(days = 30, limit = 20, siteDomain: string | null = null): Promise<PageStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase.from('page_views').select('page_url, visitor_id').gte('viewed_at', since);
  query = withSite(query, siteDomain);
  const { data } = await query;

  if (!data) return [];

  const byPage: Record<string, { visits: number; visitors: Set<string> }> = {};
  for (const row of data) {
    const url = row.page_url;
    if (!byPage[url]) byPage[url] = { visits: 0, visitors: new Set() };
    byPage[url].visits++;
    byPage[url].visitors.add(row.visitor_id);
  }

  return Object.entries(byPage)
    .sort(([, a], [, b]) => b.visits - a.visits)
    .slice(0, limit)
    .map(([page_url, v]) => ({
      page_url,
      visits: v.visits,
      unique_visitors: v.visitors.size,
    }));
}

// ─── Geographic Analytics ─────────────────────────────────────────────────────

export async function fetchCountryStats(days = 30, siteDomain: string | null = null): Promise<LocationStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Get visitor IDs for filtered page views
  let pvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);
  const { data: pvData } = await pvQuery;
  const visitorIds = [...new Set((pvData ?? []).map((r) => r.visitor_id))];
  if (visitorIds.length === 0) return [];

  const { data } = await supabase
    .from('locations')
    .select('country, country_code')
    .in('visitor_id', visitorIds)
    .gte('created_at', since);

  if (!data) return [];

  const byCountry: Record<string, LocationStat> = {};
  for (const row of data as Array<{ country: string | null; country_code: string | null }>) {
    const c = row.country ?? 'Unknown';
    const cc = row.country_code ?? 'XX';
    if (!byCountry[c]) byCountry[c] = { country: c, country_code: cc, visits: 0 };
    byCountry[c].visits++;
  }

  return Object.values(byCountry).sort((a, b) => b.visits - a.visits);
}

export async function fetchRegionStats(days = 30, siteDomain: string | null = null): Promise<RegionStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let pvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);
  const { data: pvData } = await pvQuery;
  const visitorIds = [...new Set((pvData ?? []).map((r) => r.visitor_id))];
  if (visitorIds.length === 0) return [];

  const { data } = await supabase
    .from('locations')
    .select('region')
    .in('visitor_id', visitorIds);

  if (!data) return [];

  const byRegion: Record<string, number> = {};
  for (const row of data as Array<{ region: string | null }>) {
    const r = row.region ?? 'Unknown';
    byRegion[r] = (byRegion[r] ?? 0) + 1;
  }

  return Object.entries(byRegion)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([region, visits]) => ({ region, visits }));
}

export async function fetchCityStats(days = 30, siteDomain: string | null = null): Promise<CityStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let pvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);
  const { data: pvData } = await pvQuery;
  const visitorIds = [...new Set((pvData ?? []).map((r) => r.visitor_id))];
  if (visitorIds.length === 0) return [];

  const { data } = await supabase
    .from('locations')
    .select('city')
    .in('visitor_id', visitorIds);

  if (!data) return [];

  const byCity: Record<string, number> = {};
  for (const row of data as Array<{ city: string | null }>) {
    const c = row.city ?? 'Unknown';
    byCity[c] = (byCity[c] ?? 0) + 1;
  }

  return Object.entries(byCity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([city, visits]) => ({ city, visits }));
}

// ─── Device & Browser Analytics ───────────────────────────────────────────────

export async function fetchDeviceStats(days = 30, siteDomain: string | null = null): Promise<DeviceStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let pvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);
  const { data: pvData } = await pvQuery;
  const visitorIds = [...new Set((pvData ?? []).map((r) => r.visitor_id))];
  if (visitorIds.length === 0) return [];

  const { data } = await supabase.from('devices').select('device_type').in('visitor_id', visitorIds);
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ device_type: string | null }>) {
    const d = row.device_type ?? 'Unknown';
    counts[d] = (counts[d] ?? 0) + 1;
  }

  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([device_type, count]) => ({
      device_type,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

export async function fetchBrowserStats(days = 30, siteDomain: string | null = null): Promise<BrowserStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let pvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);
  const { data: pvData } = await pvQuery;
  const visitorIds = [...new Set((pvData ?? []).map((r) => r.visitor_id))];
  if (visitorIds.length === 0) return [];

  const { data } = await supabase.from('devices').select('browser').in('visitor_id', visitorIds);
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ browser: string | null }>) {
    const b = row.browser ?? 'Unknown';
    counts[b] = (counts[b] ?? 0) + 1;
  }

  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([browser, count]) => ({
      browser,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

export async function fetchOSStats(days = 30, siteDomain: string | null = null): Promise<OSStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let pvQuery = supabase.from('page_views').select('visitor_id').gte('viewed_at', since);
  pvQuery = withSite(pvQuery, siteDomain);
  const { data: pvData } = await pvQuery;
  const visitorIds = [...new Set((pvData ?? []).map((r) => r.visitor_id))];
  if (visitorIds.length === 0) return [];

  const { data } = await supabase.from('devices').select('os').in('visitor_id', visitorIds);
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ os: string | null }>) {
    const o = row.os ?? 'Unknown';
    counts[o] = (counts[o] ?? 0) + 1;
  }

  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([os, count]) => ({
      os,
      count,
      percentage: Math.round((count / total) * 100),
    }));
}

// ─── Traffic Sources ──────────────────────────────────────────────────────────

export async function fetchReferrerStats(days = 30, limit = 15, siteDomain: string | null = null): Promise<ReferrerStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase.from('page_views').select('referrer_domain').gte('viewed_at', since).not('referrer_domain', 'is', null);
  query = withSite(query, siteDomain);
  const { data } = await query;

  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    const d = row.referrer_domain ?? 'Direct';
    counts[d] = (counts[d] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([referrer_domain, visits]) => ({ referrer_domain, visits }));
}

// ─── Campaign / UTM Analytics ─────────────────────────────────────────────────

export async function fetchCampaignStats(days = 30, siteDomain: string | null = null): Promise<CampaignStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase
    .from('page_views')
    .select('utm_campaign, utm_source, utm_medium, visitor_id')
    .gte('viewed_at', since)
    .not('utm_campaign', 'is', null);
  query = withSite(query, siteDomain);
  const { data } = await query;

  if (!data) return [];

  const map: Record<string, CampaignStat & { visitors: Set<string> }> = {};
  for (const row of data as Array<{ utm_campaign: string | null; utm_source: string | null; utm_medium: string | null; visitor_id: string }>) {
    const key = row.utm_campaign ?? 'unknown';
    if (!map[key]) {
      map[key] = {
        utm_campaign: key,
        utm_source: row.utm_source,
        utm_medium: row.utm_medium,
        visits: 0,
        unique_visitors: 0,
        visitors: new Set(),
      };
    }
    map[key].visits++;
    map[key].visitors.add(row.visitor_id);
  }

  return Object.values(map)
    .sort((a, b) => b.visits - a.visits)
    .map(({ visitors, ...rest }) => ({ ...rest, unique_visitors: visitors.size }));
}

export async function fetchUtmSourceStats(days = 30, siteDomain: string | null = null): Promise<UtmSourceStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase
    .from('page_views')
    .select('utm_source')
    .gte('viewed_at', since)
    .not('utm_source', 'is', null);
  query = withSite(query, siteDomain);
  const { data } = await query;
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ utm_source: string | null }>) {
    const s = row.utm_source ?? 'unknown';
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([utm_source, visits]) => ({ utm_source, visits }));
}

export async function fetchUtmMediumStats(days = 30, siteDomain: string | null = null): Promise<UtmMediumStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase
    .from('page_views')
    .select('utm_medium')
    .gte('viewed_at', since)
    .not('utm_medium', 'is', null);
  query = withSite(query, siteDomain);
  const { data } = await query;
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ utm_medium: string | null }>) {
    const m = row.utm_medium ?? 'unknown';
    counts[m] = (counts[m] ?? 0) + 1;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([utm_medium, visits]) => ({ utm_medium, visits }));
}

export async function fetchRefStats(days = 30, siteDomain: string | null = null): Promise<RefStat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase
    .from('page_views')
    .select('ref_param')
    .gte('viewed_at', since)
    .not('ref_param', 'is', null);
  query = withSite(query, siteDomain);
  const { data } = await query;
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ ref_param: string | null }>) {
    const r = row.ref_param ?? 'unknown';
    counts[r] = (counts[r] ?? 0) + 1;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([ref_param, visits]) => ({ ref_param, visits }));
}

// ─── Real-Time Stats ──────────────────────────────────────────────────────────

export async function fetchRealTimeStats(): Promise<RealTimeStats> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const [activeSessionsRes, recentViewsRes] = await Promise.all([
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('last_activity', thirtyMinAgo),
    supabase
      .from('page_views')
      .select(`
        visitor_id,
        page_url,
        page_title,
        viewed_at,
        visitors!inner(is_returning),
        sessions!inner(last_activity)
      `)
      .gte('viewed_at', fiveMinAgo)
      .order('viewed_at', { ascending: false })
      .limit(50),
  ]);

  const recentViews = Array.isArray(recentViewsRes.data) ? recentViewsRes.data : [];

  // Active pages from recent views
  const activePageMap: Record<string, number> = {};
  for (const row of recentViews) {
    const url = row.page_url;
    activePageMap[url] = (activePageMap[url] ?? 0) + 1;
  }
  const active_pages = Object.entries(activePageMap)
    .sort(([, a], [, b]) => b - a)
    .map(([page_url, active_count]) => ({ page_url, active_count }));

  // Unique active visitors
  const activeVisitorSet = new Set(recentViews.map((r) => r.visitor_id));

  // Recent visitors with location/device from a broader query
  const recentRes = await supabase
    .from('page_views')
    .select(`
      visitor_id,
      page_url,
      page_title,
      viewed_at,
      visitors!inner(is_returning),
      sessions!inner(is_active)
    `)
    .order('viewed_at', { ascending: false })
    .limit(20);

  const recentRows = Array.isArray(recentRes.data) ? recentRes.data : [];

  // Fetch location and device for recent visitor IDs
  const recentVisitorIds = [...new Set(recentRows.map((r) => r.visitor_id))].slice(0, 20);

  const [locRes, devRes] = await Promise.all([
    supabase
      .from('locations')
      .select('visitor_id, country, city')
      .in('visitor_id', recentVisitorIds),
    supabase
      .from('devices')
      .select('visitor_id, device_type, browser')
      .in('visitor_id', recentVisitorIds),
  ]);

  const locMap: Record<string, { country: string | null; city: string | null }> = {};
  for (const l of locRes.data ?? []) locMap[l.visitor_id] = { country: l.country, city: l.city };

  const devMap: Record<string, { device_type: string | null; browser: string | null }> = {};
  for (const d of devRes.data ?? []) devMap[d.visitor_id] = { device_type: d.device_type, browser: d.browser };

  const recent_visitors = recentRows.map((row) => ({
    visitor_id: row.visitor_id,
    page_url: row.page_url,
    page_title: row.page_title ?? null,
    country: locMap[row.visitor_id]?.country ?? null,
    city: locMap[row.visitor_id]?.city ?? null,
    device_type: devMap[row.visitor_id]?.device_type ?? null,
    browser: devMap[row.visitor_id]?.browser ?? null,
    viewed_at: row.viewed_at,
    is_returning: (row.visitors as unknown as { is_returning: boolean }).is_returning ?? false,
  }));

  return {
    active_visitors: activeVisitorSet.size,
    active_sessions: activeSessionsRes.count ?? 0,
    active_pages,
    recent_visitors,
  };
}
