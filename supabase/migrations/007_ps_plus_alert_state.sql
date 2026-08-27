CREATE TABLE IF NOT EXISTS ps_plus_alert_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_alerted_product_ids TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ps_plus_alert_state ENABLE ROW LEVEL SECURITY;