CREATE TABLE IF NOT EXISTS recommendation_cache (
  user_id TEXT PRIMARY KEY,           -- Clerk userId, one cache row per user
  rule_based JSONB NOT NULL DEFAULT '[]',
  ai_picks JSONB NOT NULL DEFAULT '[]',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own recommendation_cache" ON recommendation_cache
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own recommendation_cache" ON recommendation_cache
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own recommendation_cache" ON recommendation_cache
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own recommendation_cache" ON recommendation_cache
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);
