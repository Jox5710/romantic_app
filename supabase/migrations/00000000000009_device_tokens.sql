-- Native push device tokens — one row per native app install (FCM on Android,
-- APNs on iOS) a user has enabled push on. Complements push_subscriptions
-- (which holds Web Push endpoints for browsers/PWAs). The heartbeat send path
-- looks up the partner's device tokens (service-role) and pushes via FCM.

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz default now()
);

create index if not exists idx_device_tokens_user on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;

-- A user manages only their own device tokens. The send path reads a partner's
-- tokens with the service-role key (bypasses RLS), so no cross-user read policy
-- is needed here — mirrors own_push_subscriptions.
drop policy if exists own_device_tokens on public.device_tokens;
create policy own_device_tokens on public.device_tokens
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
