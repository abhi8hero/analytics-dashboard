// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Visitor {
  id: string;
  fingerprint: string;
  ip_address: string | null;
  ip_hash: string | null;
  first_seen: string;
  last_seen: string;
  visit_count: number;
  is_returning: boolean;
}

export interface Location {
  id: string;
  visitor_id: string;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Device {
  id: string;
  visitor_id: string;
  device_type: string | null;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  screen_resolution: string | null;
  language: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  visitor_id: string;
  session_token: string;
  started_at: string;
  last_activity: string;
  ended_at: string | null;
  page_count: number;
  duration_seconds: number | null;
  is_active: boolean;
}

export interface PageView {
  id: string;
  visitor_id: string;
  session_id: string;
  page_url: string;
  page_title: string | null;
  referrer_url: string | null;
  referrer_domain: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  ref_param: string | null;
  site_domain: string | null;
  viewed_at: string;
  time_on_page_seconds: number | null;
}

// ─── Analytics / Dashboard Types ─────────────────────────────────────────────

export interface OverviewStats {
  total_visits: number;
  unique_visitors: number;
  total_sessions: number;
  returning_visitors: number;
}

export interface DailyVisit {
  date: string;
  visits: number;
  unique_visitors: number;
}

export interface PageStat {
  page_url: string;
  visits: number;
  unique_visitors: number;
}

export interface LocationStat {
  country: string;
  country_code: string;
  visits: number;
}

export interface RegionStat {
  region: string;
  visits: number;
}

export interface CityStat {
  city: string;
  visits: number;
}

export interface DeviceStat {
  device_type: string;
  count: number;
  percentage: number;
}

export interface BrowserStat {
  browser: string;
  count: number;
  percentage: number;
}

export interface OSStat {
  os: string;
  count: number;
  percentage: number;
}

export interface ReferrerStat {
  referrer_domain: string;
  visits: number;
}

export interface ActivePage {
  page_url: string;
  active_count: number;
}

export interface RecentVisitor {
  visitor_id: string;
  page_url: string;
  page_title: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  viewed_at: string;
  is_returning: boolean;
}

export interface RealTimeStats {
  active_visitors: number;
  active_sessions: number;
  active_pages: ActivePage[];
  recent_visitors: RecentVisitor[];
}

// ─── Tracking Payload ─────────────────────────────────────────────────────────

export interface TrackingPayload {
  fingerprint: string;
  session_token: string;
  page_url: string;
  page_title: string;
  referrer_url: string;
  referrer_domain: string;
  device_type: string;
  browser: string;
  browser_version: string;
  os: string;
  os_version: string;
  screen_resolution: string;
  language: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  ref_param: string | null;
  site_domain: string;
}

// ─── Campaign / UTM Analytics ─────────────────────────────────────────────────

export interface CampaignStat {
  utm_campaign: string;
  utm_source: string | null;
  utm_medium: string | null;
  visits: number;
  unique_visitors: number;
}

export interface UtmSourceStat {
  utm_source: string;
  visits: number;
}

export interface UtmMediumStat {
  utm_medium: string;
  visits: number;
}

export interface RefStat {
  ref_param: string;
  visits: number;
}
