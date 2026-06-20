-- =========================
-- AI POSE STUDIO
-- Couples upload two photos; Gemini merges them into a chosen romantic pose.
-- =========================

-- Generated couple portraits. Image files live in the `couple-photos` storage
-- bucket; rows hold metadata + the chosen pose label.
create table if not exists pose_creations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples on delete cascade not null,
  created_by uuid references auth.users not null,
  pose_label text not null,
  result_path text not null,
  created_at timestamptz default now()
);
alter table pose_creations enable row level security;
create policy "couple members access pose_creations" on pose_creations
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id() and created_by = auth.uid());
create index if not exists idx_pose_creations_couple on pose_creations (couple_id, created_at desc);

-- Per-day generation quota — 2/day/couple. Incremented server-side (service role).
create table if not exists pose_quota (
  couple_id uuid references couples on delete cascade not null,
  day date not null,
  count int not null default 0,
  primary key (couple_id, day)
);
alter table pose_quota enable row level security;
create policy "couple members read pose_quota" on pose_quota
  for select using (couple_id = current_couple_id());

-- Collaborative pose vote — one live round per couple. Each partner proposes a
-- pose line and votes which they prefer; mirrors the dinner swipe "both agree".
create table if not exists pose_votes (
  couple_id uuid references couples on delete cascade primary key,
  option_a text,
  option_b text,
  author_a uuid references auth.users,
  author_b uuid references auth.users,
  choice_a text check (choice_a in ('a','b')),
  choice_b text check (choice_b in ('a','b')),
  updated_at timestamptz default now()
);
alter table pose_votes enable row level security;
create policy "couple members access pose_votes" on pose_votes
  using (couple_id = current_couple_id())
  with check (couple_id = current_couple_id());

-- Atomic reserve-a-generation: increments today's counter and returns the new
-- count. The route rejects (and the trigger never fires twice) when it exceeds
-- the cap, preventing two simultaneous requests from both passing a plain check.
create or replace function reserve_pose_generation(p_couple_id uuid, p_limit int)
returns int as $$
declare v_count int;
begin
  insert into pose_quota (couple_id, day, count)
    values (p_couple_id, current_date, 1)
  on conflict (couple_id, day)
    do update set count = pose_quota.count + 1
  returning count into v_count;
  if v_count > p_limit then
    -- roll back this reservation; signal "over limit" to the caller
    update pose_quota set count = count - 1 where couple_id = p_couple_id and day = current_date;
    return -1;
  end if;
  return v_count;
end; $$ language plpgsql volatile security definer;
grant execute on function reserve_pose_generation(uuid, int) to authenticated, service_role;

-- Storage bucket for couple photos (generated results).
insert into storage.buckets (id, name) values ('couple-photos', 'couple-photos')
  on conflict do nothing;
create policy "couple members can upload couple photos" on storage.objects
  for insert with check (bucket_id = 'couple-photos' and auth.uid() is not null);
create policy "couple members can read couple photos" on storage.objects
  for select using (bucket_id = 'couple-photos' and auth.uid() is not null);
create policy "couple members can delete couple photos" on storage.objects
  for delete using (bucket_id = 'couple-photos' and auth.uid() is not null);
