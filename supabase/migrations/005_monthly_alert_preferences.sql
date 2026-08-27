-- 🔹 Create monthly_alert_preferences Table
CREATE TABLE IF NOT EXISTS monthly_alert_preferences (
  user_id TEXT PRIMARY KEY,          -- Clerk userId
  in_app_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 🔹 Enable Row Level Security (RLS)
ALTER TABLE monthly_alert_preferences ENABLE ROW LEVEL SECURITY;

-- 🔹 Create RLS Policies

CREATE POLICY "Users can read their own monthly_alert_preferences" ON monthly_alert_preferences
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own monthly_alert_preferences" ON monthly_alert_preferences
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own monthly_alert_preferences" ON monthly_alert_preferences
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);