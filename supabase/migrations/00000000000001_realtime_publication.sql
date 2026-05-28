-- Realtime CDC requires a Postgres publication named `supabase_realtime`.
-- The supabase/realtime container subscribes to it for postgres_changes events.
-- Idempotent: skipped if already present from a prior Supabase setup.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;
