-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- TYPES
-- =========================
create type couple_state as enum (
  'drafted', 'invited', 'mutual', 'pending_admin', 'approved', 'rejected'
);

create type whisper_feeling as enum (
  'unseen','distant','tender','weary','anxious','small','alone','frustrated','hurt','longing'
);

create type whisper_response as enum ('heard','tell_more','lets_talk');

-- =========================
-- AUTH & COUPLE
-- =========================
create table couples (
  id uuid primary key default gen_random_uuid(),
  state couple_state not null default 'drafted',
  name_a text,
  name_b text,
  wedding_date timestamptz,
  invite_code text unique,
  invite_email text,
  initiator_id uuid references auth.users not null,
  partner_id uuid references auth.users,
  admin_note text,
  approved_at timestamptz,
  approved_by uuid references auth.users,
  created_at timestamptz default now()
);

create table couple_members (
  user_id uuid references auth.users primary key,
  couple_id uuid references couples on delete cascade not null,
  role text check (role in ('initiator','partner')) not null,
  display_name text,
  avatar_url text,
  confirmed_at timestamptz
);

create table admins (
  user_id uuid references auth.users primary key,
  added_at timestamptz default now()
);

-- Helper functions
create or replace function is_admin(uid uuid) returns boolean as $$
  select exists (select 1 from admins where user_id = uid);
$$ language sql stable security definer;

create or replace function current_couple_id() returns uuid as $$
  select couple_id from couple_members where user_id = auth.uid();
$$ language sql stable security definer;

-- =========================
-- MEMORIES & TIMELINE
-- =========================
create table memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  occurred_at timestamptz not null,
  caption text not null,
  body text,
  image_url text,
  place_id uuid,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- =========================
-- BUCKET LIST
-- =========================
create table bucket_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  title text not null,
  category text,
  notes text,
  position int not null default 0,
  completed_at timestamptz,
  memory_id uuid references memories,
  created_at timestamptz default now()
);

-- =========================
-- DAILY PROMPT
-- =========================
create table daily_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_en text not null,
  prompt_ar text not null,
  depth int default 1
);

create table prompt_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  prompt_id uuid references daily_prompts not null,
  user_id uuid references auth.users not null,
  answer text not null,
  for_date date not null,
  created_at timestamptz default now(),
  unique (couple_id, prompt_id, user_id, for_date)
);

-- =========================
-- TIME CAPSULE (client-encrypted)
-- =========================
create table capsule_letters (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  author_id uuid references auth.users not null,
  recipient text check (recipient in ('partner','both','future_us')) not null,
  ciphertext text not null,
  nonce text not null,
  unlock_at timestamptz not null,
  created_at timestamptz default now()
);

-- =========================
-- VIBE SYNC
-- =========================
create table vibe_pings (
  couple_id uuid references couples not null,
  user_id uuid references auth.users not null,
  mood text,
  energy int check (energy between 1 and 5),
  craving text,
  updated_at timestamptz default now(),
  primary key (couple_id, user_id)
);

-- =========================
-- PLACES & US MAP
-- =========================
create table places (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  kind text check (kind in ('visited','dream','first_date','anniversary','home')) not null,
  visited_at date,
  note text,
  created_at timestamptz default now()
);

-- Foreign key memory→place
alter table memories add constraint fk_memory_place foreign key (place_id) references places(id) on delete set null;

-- =========================
-- WHISPER
-- =========================
create table whispers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  author_id uuid references auth.users not null,
  recipient_id uuid references auth.users not null,
  body_what text not null,
  feeling whisper_feeling not null,
  body_wish text not null,
  sent_at timestamptz not null default now(),
  deliver_at timestamptz not null,
  read_at timestamptz,
  response whisper_response,
  response_text text,
  resolved_at timestamptz
);

create or replace function trunc_day_utc(ts timestamptz) returns date
  language sql immutable as $$ select (ts at time zone 'UTC')::date $$;

create unique index one_whisper_per_day
  on whispers (author_id, trunc_day_utc(sent_at));

-- =========================
-- MIRROR MODE
-- =========================
create table mirror_questions (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_ar text not null,
  category text
);

create table mirror_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  question_id uuid references mirror_questions not null,
  week_of date not null,
  revealed_at timestamptz,
  unique (couple_id, week_of)
);

create table mirror_answers (
  session_id uuid references mirror_sessions on delete cascade not null,
  user_id uuid references auth.users not null,
  answer text not null,
  submitted_at timestamptz default now(),
  primary key (session_id, user_id)
);

-- =========================
-- PROMISES
-- =========================
create table promises (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  author_id uuid references auth.users not null,
  text text not null,
  cadence text check (cadence in ('once','daily','weekly','monthly','yearly')) default 'once',
  next_check_at timestamptz,
  kept_count int default 0,
  broken_count int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table promise_checks (
  id uuid primary key default gen_random_uuid(),
  promise_id uuid references promises on delete cascade not null,
  kept boolean not null,
  note text,
  checked_at timestamptz default now()
);

-- =========================
-- HEARTBEAT
-- =========================
create table heartbeats (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  from_user uuid references auth.users not null,
  to_user uuid references auth.users not null,
  sent_at timestamptz default now()
);

-- =========================
-- GRATITUDE
-- =========================
create table gratitudes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  user_id uuid references auth.users not null,
  for_text text not null,
  for_date date not null,
  created_at timestamptz default now()
);

-- =========================
-- ENABLE RLS
-- =========================
alter table couples enable row level security;
alter table couple_members enable row level security;
alter table admins enable row level security;
alter table memories enable row level security;
alter table bucket_items enable row level security;
alter table daily_prompts enable row level security;
alter table prompt_answers enable row level security;
alter table capsule_letters enable row level security;
alter table vibe_pings enable row level security;
alter table places enable row level security;
alter table whispers enable row level security;
alter table mirror_questions enable row level security;
alter table mirror_sessions enable row level security;
alter table mirror_answers enable row level security;
alter table promises enable row level security;
alter table promise_checks enable row level security;
alter table heartbeats enable row level security;
alter table gratitudes enable row level security;

-- =========================
-- RLS POLICIES
-- =========================

-- couples
create policy "members_read_own_couple" on couples for select using (
  id = current_couple_id() or initiator_id = auth.uid() or is_admin(auth.uid())
);
create policy "any_user_creates_draft" on couples for insert with check (initiator_id = auth.uid());
create policy "members_update_draft_invited" on couples for update using (
  (auth.uid() = initiator_id and state in ('drafted','invited'))
  or is_admin(auth.uid())
);

-- couple_members
create policy "read_my_membership" on couple_members for select using (
  user_id = auth.uid() or couple_id = current_couple_id() or is_admin(auth.uid())
);
create policy "insert_my_membership" on couple_members for insert with check (user_id = auth.uid());
create policy "update_my_membership" on couple_members for update using (user_id = auth.uid());

-- admins
create policy "admins_read_all" on admins for select using (is_admin(auth.uid()) or user_id = auth.uid());

-- daily_prompts & mirror_questions: public read
create policy "anyone_read_prompts" on daily_prompts for select using (true);
create policy "anyone_read_mirror_q" on mirror_questions for select using (true);

-- Generic couple-scoped policies (memories, bucket_items, prompt_answers,
-- vibe_pings, places, mirror_sessions, mirror_answers, promises,
-- promise_checks, heartbeats, gratitudes)

-- memories
create policy "members_or_admin_read_memories" on memories for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_memories" on memories for insert with check (couple_id = current_couple_id());
create policy "members_update_memories" on memories for update using (couple_id = current_couple_id());
create policy "members_delete_memories" on memories for delete using (couple_id = current_couple_id());

-- bucket_items
create policy "members_or_admin_read_bucket" on bucket_items for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_bucket" on bucket_items for insert with check (couple_id = current_couple_id());
create policy "members_update_bucket" on bucket_items for update using (couple_id = current_couple_id());
create policy "members_delete_bucket" on bucket_items for delete using (couple_id = current_couple_id());

-- prompt_answers
create policy "members_or_admin_read_answers" on prompt_answers for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_answers" on prompt_answers for insert with check (couple_id = current_couple_id());
create policy "members_update_answers" on prompt_answers for update using (couple_id = current_couple_id());
create policy "members_delete_answers" on prompt_answers for delete using (couple_id = current_couple_id());

-- capsule_letters (special: unlock_at gate)
create policy "capsule_read" on capsule_letters for select using (
  couple_id = current_couple_id() and unlock_at <= now()
);
create policy "capsule_insert" on capsule_letters for insert with check (couple_id = current_couple_id());

-- vibe_pings
create policy "members_read_vibe" on vibe_pings for select using (couple_id = current_couple_id());
create policy "members_upsert_vibe" on vibe_pings for insert with check (couple_id = current_couple_id());
create policy "members_update_vibe" on vibe_pings for update using (couple_id = current_couple_id());

-- places
create policy "members_or_admin_read_places" on places for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_places" on places for insert with check (couple_id = current_couple_id());
create policy "members_update_places" on places for update using (couple_id = current_couple_id());
create policy "members_delete_places" on places for delete using (couple_id = current_couple_id());

-- whispers (special: delivery delay + author/recipient scope)
create policy "whisper_read" on whispers for select using (
  (author_id = auth.uid())
  or (recipient_id = auth.uid() and deliver_at <= now())
);
create policy "whisper_insert" on whispers for insert with check (
  author_id = auth.uid() and couple_id = current_couple_id()
);
create policy "whisper_respond" on whispers for update using (recipient_id = auth.uid());

-- mirror_sessions
create policy "members_read_mirror_sessions" on mirror_sessions for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_mirror_sessions" on mirror_sessions for insert with check (couple_id = current_couple_id());
create policy "members_update_mirror_sessions" on mirror_sessions for update using (couple_id = current_couple_id());

-- mirror_answers
create policy "members_read_mirror_answers" on mirror_answers for select using (
  exists (select 1 from mirror_sessions s where s.id = session_id and s.couple_id = current_couple_id())
);
create policy "members_insert_mirror_answers" on mirror_answers for insert with check (
  user_id = auth.uid() and
  exists (select 1 from mirror_sessions s where s.id = session_id and s.couple_id = current_couple_id())
);

-- promises
create policy "members_read_promises" on promises for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_promises" on promises for insert with check (couple_id = current_couple_id());
create policy "members_update_promises" on promises for update using (couple_id = current_couple_id());
create policy "members_delete_promises" on promises for delete using (couple_id = current_couple_id());

-- promise_checks
create policy "members_read_checks" on promise_checks for select using (
  exists (select 1 from promises p where p.id = promise_id and p.couple_id = current_couple_id())
);
create policy "members_insert_checks" on promise_checks for insert with check (
  exists (select 1 from promises p where p.id = promise_id and p.couple_id = current_couple_id())
);

-- heartbeats
create policy "members_read_heartbeats" on heartbeats for select using (couple_id = current_couple_id());
create policy "members_insert_heartbeats" on heartbeats for insert with check (couple_id = current_couple_id() and from_user = auth.uid());

-- gratitudes
create policy "members_read_gratitudes" on gratitudes for select using (couple_id = current_couple_id() or is_admin(auth.uid()));
create policy "members_insert_gratitudes" on gratitudes for insert with check (couple_id = current_couple_id() and user_id = auth.uid());
create policy "members_update_gratitudes" on gratitudes for update using (couple_id = current_couple_id());
create policy "members_delete_gratitudes" on gratitudes for delete using (couple_id = current_couple_id());

-- =========================
-- SEED: Sample daily prompts
-- =========================
insert into daily_prompts (prompt_en, prompt_ar, depth) values
  ('What is one thing your partner does that makes you feel deeply seen?', 'ما هو الشيء الذي يفعله شريكك ويجعلك تشعر أنه يراك حقاً؟', 2),
  ('Describe your ideal Sunday morning together.', 'صف صباح الأحد المثالي معاً.', 1),
  ('What fear do you wish you could share more openly with your partner?', 'ما الخوف الذي تتمنى أن تشاركه بشكل أكثر انفتاحاً مع شريكك؟', 4),
  ('What does home feel like to you?', 'كيف تحس بمعنى البيت؟', 2),
  ('What is a dream you have not told your partner yet?', 'ما هو حلم لم تخبر شريكك به بعد؟', 3),
  ('What is one way you want to grow together this year?', 'ما هي طريقة واحدة تريد أن تنمو بها معاً هذا العام؟', 3),
  ('When do you feel most connected to your partner?', 'متى تشعر بأعمق ارتباط مع شريكك؟', 2),
  ('What is the kindest thing your partner has ever done for you?', 'ما أطيب شيء فعله شريكك من أجلك؟', 1),
  ('What would you like more of in your relationship?', 'ما الذي تود أن يكون أكثر في علاقتكما؟', 2),
  ('Describe the moment you knew this was the person for you.', 'صف اللحظة التي أدركت فيها أن هذا هو الشخص المناسب لك.', 3);

-- =========================
-- SEED: Mirror questions
-- =========================
insert into mirror_questions (question_en, question_ar, category) values
  ('What does love look like to you on an ordinary Tuesday?', 'كيف يبدو الحب بالنسبة لك في يوم ثلاثاء عادي؟', 'love'),
  ('Where do you see us in five years?', 'أين ترانا بعد خمس سنوات؟', 'dreams'),
  ('What is one way I could better support your growth?', 'ما هي طريقة واحدة يمكنني من خلالها دعم نموك بشكل أفضل؟', 'growth'),
  ('What does family mean to you?', 'ماذا تعني لك العائلة؟', 'family'),
  ('What is a fear you have never spoken aloud?', 'ما خوف لم تتكلم به أحداً قط؟', 'growth'),
  ('What made you fall in love with me?', 'ما الذي جعلك تقع في حبي؟', 'love'),
  ('What is the most important lesson life has taught you?', 'ما أهم درس علّمه إياك الحياة؟', 'growth'),
  ('Describe your perfect home.', 'صف بيتك المثالي.', 'dreams');

-- =========================
-- M9: NEW FEATURES
-- =========================

-- Blueprint
create table blueprint_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  user_id uuid references auth.users not null,
  category text not null check (category in ('sizes','tastes','vitals','family')),
  label text not null,
  value text not null,
  created_at timestamptz default now()
);
alter table blueprint_items enable row level security;
create policy "couple members access blueprint" on blueprint_items
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id() and user_id = auth.uid());

-- Missions
create table missions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  assigned_to uuid references auth.users not null,
  text text not null,
  deadline_at timestamptz not null,
  completed_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz default now()
);
alter table missions enable row level security;
create policy "couple members access missions" on missions
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- Truce sessions
create table truce_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  triggered_by uuid references auth.users not null,
  expires_at timestamptz not null,
  i_feel text,
  partner_i_feel text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);
alter table truce_sessions enable row level security;
create policy "couple members access truce" on truce_sessions
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- Dinner options
create table dinner_options (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  name text not null,
  category text not null check (category in ('restaurant','home_cook')) default 'restaurant',
  note text,
  swipe_a text check (swipe_a in ('yes','no')),
  swipe_b text check (swipe_b in ('yes','no')),
  matched_at timestamptz,
  created_at timestamptz default now()
);
alter table dinner_options enable row level security;
create policy "couple members access dinner" on dinner_options
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- Canvas strokes
create table canvas_strokes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  author_id uuid references auth.users not null,
  points float8[] not null,
  color text not null default '#c9a961',
  width integer not null default 3,
  created_at timestamptz default now()
);
alter table canvas_strokes enable row level security;
create policy "couple members access canvas" on canvas_strokes
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id() and author_id = auth.uid());

-- Queue items
create table queue_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  title text not null,
  category text not null check (category in ('movie','show','book','place')) default 'movie',
  url text,
  image_url text,
  position integer not null default 0,
  watched_at timestamptz,
  rating_a integer check (rating_a between 1 and 5),
  rating_b integer check (rating_b between 1 and 5),
  created_at timestamptz default now()
);
alter table queue_items enable row level security;
create policy "couple members access queue" on queue_items
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- Voice notes (metadata only; audio files in storage)
create table voice_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  author_id uuid references auth.users not null,
  storage_path text not null,
  duration_sec float4 not null,
  played_at timestamptz,
  created_at timestamptz default now()
);
alter table voice_notes enable row level security;
create policy "couple members access voice_notes" on voice_notes
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id() and author_id = auth.uid());

-- Storage bucket for voice notes
insert into storage.buckets (id, name) values ('voice-notes', 'voice-notes')
  on conflict do nothing;
create policy "couple members can upload voice notes" on storage.objects
  for insert with check (bucket_id = 'voice-notes' and auth.uid() is not null);
create policy "couple members can read voice notes" on storage.objects
  for select using (bucket_id = 'voice-notes' and auth.uid() is not null);
