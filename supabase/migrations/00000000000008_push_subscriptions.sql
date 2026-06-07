-- Web Push subscriptions — one row per browser/device a user has enabled push on.
-- Powers closed-app heartbeat notifications: the sender's API call looks up the
-- partner's subscriptions (service-role) and pushes to each endpoint.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- A user manages only their own subscriptions. The send path reads a partner's
-- subscriptions with the service-role key (bypasses RLS), so no cross-user
-- read policy is needed here.
drop policy if exists own_push_subscriptions on public.push_subscriptions;
create policy own_push_subscriptions on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
