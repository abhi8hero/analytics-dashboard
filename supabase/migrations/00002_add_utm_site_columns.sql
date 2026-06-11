
-- Add UTM parameter columns to page_views
ALTER TABLE page_views
  ADD COLUMN utm_source      text,
  ADD COLUMN utm_medium      text,
  ADD COLUMN utm_campaign    text,
  ADD COLUMN utm_term        text,
  ADD COLUMN utm_content     text,
  ADD COLUMN ref_param       text,
  ADD COLUMN site_domain     text;

-- Add site_domain to sessions (for site-level filtering)
ALTER TABLE sessions
  ADD COLUMN site_domain text;

-- Indexes for fast filtering
CREATE INDEX idx_page_views_utm_source   ON page_views(utm_source);
CREATE INDEX idx_page_views_utm_campaign ON page_views(utm_campaign);
CREATE INDEX idx_page_views_utm_medium   ON page_views(utm_medium);
CREATE INDEX idx_page_views_site_domain  ON page_views(site_domain);
CREATE INDEX idx_sessions_site_domain    ON sessions(site_domain);
