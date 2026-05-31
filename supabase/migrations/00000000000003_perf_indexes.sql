-- Performance indexes — all CREATE INDEX IF NOT EXISTS, fully idempotent.
--
-- Background: every couple-scoped table is read via `where couple_id = ?` (the
-- RLS policy via current_couple_id()), but only one explicit index existed
-- (one_whisper_per_day). Postgres falls back to sequential scans on the larger
-- tables. This migration adds the missing covering indexes for the read paths
-- the app actually exercises.
--
-- Column names follow the real schema in 00000000000000_init.sql — note that
-- a few tables use sent_at/occurred_at instead of created_at.

-- Couple-scoped composite indexes (couple_id + ordering column for timeline reads)
CREATE INDEX IF NOT EXISTS idx_memories_couple_id        ON memories(couple_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_bucket_items_couple_id    ON bucket_items(couple_id, position);
CREATE INDEX IF NOT EXISTS idx_prompt_answers_couple_id  ON prompt_answers(couple_id, for_date DESC);
-- vibe_pings has primary key (couple_id, user_id) — already indexed.
CREATE INDEX IF NOT EXISTS idx_places_couple_id          ON places(couple_id);
CREATE INDEX IF NOT EXISTS idx_whispers_couple_id        ON whispers(couple_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_mirror_sessions_couple_id ON mirror_sessions(couple_id, week_of DESC);
CREATE INDEX IF NOT EXISTS idx_promises_couple_id        ON promises(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gratitudes_couple_id      ON gratitudes(couple_id, for_date DESC);
CREATE INDEX IF NOT EXISTS idx_missions_couple_id        ON missions(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_truce_sessions_couple_id  ON truce_sessions(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dinner_options_couple_id  ON dinner_options(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_strokes_couple_id  ON canvas_strokes(couple_id, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_items_couple_id     ON queue_items(couple_id, position);
CREATE INDEX IF NOT EXISTS idx_voice_notes_couple_id     ON voice_notes(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blueprint_items_couple_id ON blueprint_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_couple_id      ON heartbeats(couple_id, sent_at DESC);

-- RLS supporting indexes (every couple_members lookup goes through user_id)
CREATE INDEX IF NOT EXISTS idx_couple_members_user_id    ON couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_couples_state             ON couples(state);

-- Foreign-key indexes for cross-user / inbox queries
CREATE INDEX IF NOT EXISTS idx_whispers_recipient_id     ON whispers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_to_user        ON heartbeats(to_user);
CREATE INDEX IF NOT EXISTS idx_memories_created_by       ON memories(created_by);
CREATE INDEX IF NOT EXISTS idx_promises_author_id        ON promises(author_id);
CREATE INDEX IF NOT EXISTS idx_missions_assigned_to      ON missions(assigned_to);
