-- P5 Tier 2: tracks the Extra/Premium catalog's product IDs (+ name/link)
-- as of the last cron run, so the cron can diff today's ~470-title list
-- against yesterday's to find real additions/removals instead of
-- re-alerting the same catalog every day. Same singleton-row pattern as
-- ps_plus_alert_state (P5 Tier 1).
CREATE TABLE IF NOT EXISTS ps_plus_catalog_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_seen_games JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ps_plus_catalog_state ENABLE ROW LEVEL SECURITY;

-- A second, independent opt-in from the existing Essential-games toggle —
-- Extra/Premium catalog matches are a different shape (wishlist-matched,
-- not "alert on all 3 every month"), so a user might want one without the
-- other.
ALTER TABLE monthly_alert_preferences
  ADD COLUMN IF NOT EXISTS catalog_alerts_enabled BOOLEAN NOT NULL DEFAULT false;
