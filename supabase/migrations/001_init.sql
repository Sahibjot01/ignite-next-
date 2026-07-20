-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 🔹 Create Wishlist Table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,          -- Clerk userId
  game_id INTEGER NOT NULL,       -- RAWG game id
  game_name TEXT NOT NULL,
  game_image TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- 🔹 Create Price Snapshots Table
CREATE TABLE IF NOT EXISTS price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id INTEGER NOT NULL,       -- RAWG id
  cheapshark_id TEXT,             -- matched CheapShark gameID
  store_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  normal_price NUMERIC,
  is_on_sale BOOLEAN DEFAULT false,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 🔹 Create Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,          -- Clerk userId
  game_id INTEGER NOT NULL,       -- RAWG id
  target_price NUMERIC NOT NULL,   -- alert when price drops to or below this
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,        -- null until first trigger
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- 🔹 Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,          -- Clerk userId
  game_id INTEGER NOT NULL,       -- RAWG id
  message TEXT NOT NULL,           -- e.g. "Cyberpunk 2077 dropped to $19.99!"
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 🔹 Create Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_game_date ON price_snapshots(game_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON price_alerts(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- 🔹 Enable Row Level Security (RLS)
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 🔹 Create RLS Policies

-- Wishlists Policies
CREATE POLICY "Users can read their own wishlists" ON wishlists
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own wishlists" ON wishlists
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own wishlists" ON wishlists
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own wishlists" ON wishlists
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Price Snapshots Policies (Public read, admin write)
CREATE POLICY "Anyone can read price snapshots" ON price_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert price snapshots" ON price_snapshots
  FOR INSERT WITH CHECK (true);

-- Price Alerts Policies
CREATE POLICY "Users can read their own price alerts" ON price_alerts
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own price alerts" ON price_alerts
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own price alerts" ON price_alerts
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own price alerts" ON price_alerts
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Notifications Policies
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);
