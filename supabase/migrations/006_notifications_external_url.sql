ALTER TABLE notifications ALTER COLUMN game_id DROP NOT NULL;
ALTER TABLE notifications ADD COLUMN external_url TEXT;