-- These two policies were named "Service role can insert ..." but were
-- written as `FOR INSERT WITH CHECK (true)`, which applies to EVERY role —
-- including anon, whose key ships to every browser. Confirmed live on
-- 2026-09-19: an unauthenticated REST insert with the public anon key
-- succeeded on both tables, letting anyone write fake rows into the public
-- "Recently Changed in the Catalog" feed or poison price history.
--
-- The service role bypasses RLS entirely, so the crons (which use the
-- service-role client) don't need an INSERT policy at all. With RLS enabled
-- and no INSERT policy, only the service role can write. SELECT stays public.
DROP POLICY IF EXISTS "Service role can insert price snapshots" ON price_snapshots;
DROP POLICY IF EXISTS "Service role can insert catalog change log" ON catalog_change_log;
