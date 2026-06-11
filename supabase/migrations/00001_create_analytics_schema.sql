
-- Visitors table
CREATE TABLE visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  ip_address text,
  ip_hash text,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  visit_count integer NOT NULL DEFAULT 1,
  is_returning boolean NOT NULL DEFAULT false,
  UNIQUE(fingerprint)
);

-- Locations table
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  country text,
  country_code text,
  region text,
  city text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Devices table
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  device_type text,
  browser text,
  browser_version text,
  os text,
  os_version text,
  screen_resolution text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sessions table
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  page_count integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  is_active boolean NOT NULL DEFAULT true
);

-- Page views table
CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  page_url text NOT NULL,
  page_title text,
  referrer_url text,
  referrer_domain text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  time_on_page_seconds integer
);

-- Analytics logs table (raw event log)
CREATE TABLE analytics_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'pageview',
  visitor_id uuid REFERENCES visitors(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  page_url text,
  ip_address text,
  user_agent text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_visitors_fingerprint ON visitors(fingerprint);
CREATE INDEX idx_visitors_last_seen ON visitors(last_seen);
CREATE INDEX idx_sessions_visitor_id ON sessions(visitor_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX idx_page_views_page_url ON page_views(page_url);
CREATE INDEX idx_locations_visitor_id ON locations(visitor_id);
CREATE INDEX idx_devices_visitor_id ON devices(visitor_id);
CREATE INDEX idx_analytics_logs_created_at ON analytics_logs(created_at);

-- Enable Realtime for sessions and page_views
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE page_views;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;

-- RLS: Disable for all tables (no auth required for this system, admin only)
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_logs DISABLE ROW LEVEL SECURITY;
