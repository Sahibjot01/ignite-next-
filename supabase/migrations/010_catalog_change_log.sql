-- Public, unfiltered "what changed in the Extra/Premium catalog" feed — a
-- different concern from the per-user wishlist-matched notifications in
-- ps_plus_catalog_state/notifications. That table only ever stores the
-- LATEST snapshot (needed to diff tomorrow against), so once an addition or
-- removal is detected there's nowhere left to show it visually — this table
-- is the append-only history that makes that possible. Same
-- public-read/service-role-write shape as price_snapshots, since catalog
-- membership isn't per-user private data.
CREATE TABLE IF NOT EXISTS catalog_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  concept_url TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('added', 'removed')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_change_log_detected_at
  ON catalog_change_log(detected_at DESC);

ALTER TABLE catalog_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read catalog change log" ON catalog_change_log
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert catalog change log" ON catalog_change_log
  FOR INSERT WITH CHECK (true);
