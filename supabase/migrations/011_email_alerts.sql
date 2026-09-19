-- Independent opt-in for receiving alerts by email as well. Separate from
-- in_app_enabled / catalog_alerts_enabled, which decide WHICH alerts a user
-- gets — this decides whether those alerts also go to their account email.
ALTER TABLE monthly_alert_preferences
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT false;
