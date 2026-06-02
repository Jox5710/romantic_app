-- scripts/reset-db.sql
-- WARNING: wipes every user + every couple's data. Schema + migrations stay.
--
-- Runs on the EC2 box (or any docker-compose-up environment) via:
--   docker compose exec -T db psql -U postgres -d postgres < scripts/reset-db.sql
--
-- What gets wiped:
--   * every couple-scoped public table (the user's actual data)
--   * GoTrue auth.users (sessions + identities cascade via FK)
--   * the admins table (also cascades from auth.users on delete)
--
-- What stays:
--   * global seed content: daily_prompts, mirror_questions
--   * schema, RLS policies, indexes, migrations
--   * Caddy certs, MailHog inbox (those live in different volumes)

BEGIN;

-- All couple-scoped tables. CASCADE handles any FK we might have missed.
TRUNCATE TABLE
  public.memories,
  public.bucket_items,
  public.prompt_answers,
  public.capsule_letters,
  public.vibe_pings,
  public.places,
  public.whispers,
  public.mirror_sessions, public.mirror_answers,
  public.promises, public.promise_checks,
  public.heartbeats,
  public.gratitudes,
  public.blueprint_items,
  public.missions,
  public.truce_sessions,
  public.dinner_options,
  public.canvas_strokes,
  public.queue_items,
  public.voice_notes,
  public.couple_members,
  public.couples
RESTART IDENTITY CASCADE;

-- GoTrue users — cascades to auth.identities, auth.sessions, public.admins.
DELETE FROM auth.users;

COMMIT;

-- Sanity check — should print zero counts after the wipe.
SELECT
  'auth.users'    AS table_name, count(*) AS row_count FROM auth.users
UNION ALL SELECT 'couples',            count(*) FROM public.couples
UNION ALL SELECT 'couple_members',     count(*) FROM public.couple_members
UNION ALL SELECT 'memories',           count(*) FROM public.memories
UNION ALL SELECT 'places',             count(*) FROM public.places
ORDER BY table_name;
