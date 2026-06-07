-- Realtime was silently dead: the `supabase_realtime` publication existed (from
-- the base Supabase image) but with ZERO tables, so migration 00000001's
-- `IF NOT EXISTS … FOR ALL TABLES` was skipped and no postgres_changes events
-- ever fired. That broke heartbeat live sync, vibe sync, the awaiting-approval
-- page, and partner voice notes appearing live.
--
-- Recreate it FOR ALL TABLES (the publication's puballtables flag can't be
-- ALTERed in place, so drop + recreate). REPLICA IDENTITY FULL on the tables we
-- subscribe to ensures UPDATE/DELETE events carry the full row. Idempotent.

DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

ALTER TABLE heartbeats  REPLICA IDENTITY FULL;
ALTER TABLE vibe_pings  REPLICA IDENTITY FULL;
ALTER TABLE couples     REPLICA IDENTITY FULL;
ALTER TABLE voice_notes REPLICA IDENTITY FULL;
