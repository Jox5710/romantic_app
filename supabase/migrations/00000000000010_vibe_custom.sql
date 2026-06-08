-- Custom vibe: let a partner write their own free-text mood instead of (or in
-- addition to) picking a preset. Nullable; when set it takes precedence over the
-- preset `mood` in the UI. No RLS change needed — covered by the existing
-- vibe_pings policies.
alter table public.vibe_pings
  add column if not exists custom_mood text;
