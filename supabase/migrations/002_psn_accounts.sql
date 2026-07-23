-- 🔹 Create psn_accounts Table
CREATE TABLE IF NOT EXISTS psn_accounts (
  user_id TEXT PRIMARY KEY  ,          -- Clerk userId
  online_id TEXT NOT NULL,        --ex psn username Sahibjot1
  account_id TEXT NOT NULL,        --ex psn's internal account id
  refresh_token_encrypted TEXT NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  linked_at TIMESTAMPTZ DEFAULT now()
);


-- 🔹 Enable Row Level Security (RLS)
ALTER TABLE psn_accounts ENABLE ROW LEVEL SECURITY;

-- 🔹 Create RLS Policies

-- psn_accounts Policies
CREATE POLICY "Users can read their own psn_accounts" ON psn_accounts
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own psn_accounts" ON psn_accounts
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own psn_accounts" ON psn_accounts
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own psn_accounts" ON psn_accounts
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);
