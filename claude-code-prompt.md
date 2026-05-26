# FOREVER — Master Build Prompt for Claude Code

> Paste this entire document as the first message to Claude Code (`claude` in your terminal, or in the Claude Code web UI) after `git init`-ing a fresh repo.

---

## Mission

Build **Forever** — a private, invite-only relationship web app for couples. One admin (me) approves couples before they can use it. Luxury dark aesthetic with three themes, full English + Arabic (RTL) localization, deployable to GitHub Pages as a static export.

This is not a dating app or a public product. It's a **sanctuary**: one couple per "tenant," everything they create is theirs alone, the admin only sees approval queues — never their content.

---

## Tech Stack (non-negotiable versions)

```
next@^14.2          react@^18.3          typescript@^5.4 (strict mode ON)
tailwindcss@^3.4    next-intl@^3.20      @tanstack/react-query@^5.51
@supabase/supabase-js@^2.45                @supabase/auth-helpers-nextjs@^0.10
zustand@^4.5        framer-motion@^11     react-hook-form@^7.52   zod@^3.23
lucide-react        mapbox-gl@^3          date-fns@^3            tweetnacl@^1.0  (for capsule encryption)
```

---

## CRITICAL CONSTRAINT — Static Export for GitHub Pages

Configure `next.config.js` with:

```js
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};
```

Consequences — DO NOT use:
- ❌ Next.js middleware (`middleware.ts`)
- ❌ API routes (`app/api/**`)
- ❌ Server Actions
- ❌ `cookies()`, `headers()` from `next/headers` in server components for auth
- ❌ `revalidatePath`, ISR
- ❌ `<Image>` optimization

DO use:
- ✅ Client components for anything dynamic (`'use client'`)
- ✅ Supabase JS client called from the browser (auth, DB, realtime)
- ✅ A `<RouteGuard>` client component for protected routes
- ✅ Supabase Edge Functions (Deno) for ANY server logic (AI calls, secrets)
- ✅ Supabase RLS policies as the ONLY security boundary (the client is untrusted)

---

## Project Structure

```
forever/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                  # html/body, providers, fonts, dir
│   │   ├── page.tsx                    # dashboard (RouteGuard inside)
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── invite/page.tsx         # create couple, invite partner
│   │   │   ├── accept/[code]/page.tsx  # partner accepts invite
│   │   │   └── awaiting/page.tsx       # waiting for admin blessing
│   │   ├── timeline/page.tsx
│   │   ├── countdown/page.tsx
│   │   ├── bucket/page.tsx
│   │   ├── prompt/page.tsx
│   │   ├── capsule/page.tsx
│   │   ├── vibe/page.tsx
│   │   ├── map/page.tsx
│   │   ├── constellation/page.tsx
│   │   ├── whisper/page.tsx
│   │   ├── mirror/page.tsx
│   │   ├── promises/page.tsx
│   │   ├── echo/page.tsx
│   │   ├── heartbeat/page.tsx
│   │   ├── gratitude/page.tsx
│   │   └── admin/
│   │       ├── page.tsx                # admin dashboard
│   │       ├── couples/page.tsx        # approval queue
│   │       └── couples/[id]/page.tsx   # review one couple
│   └── globals.css
├── components/
│   ├── providers.tsx                   # QueryClient, Theme, Supabase
│   ├── route-guard.tsx                 # client-side auth + couple-state gate
│   ├── theme/                          # ThemeProvider, ThemeSwitcher
│   ├── layout/                         # AppShell, Nav, Crest, AmbientStars, LangSwitcher
│   ├── ui/                             # Card3D, GoldButton, GoldSeal, Field, Modal, Sheet
│   ├── hero/                           # Hero, Countdown
│   ├── timeline/                       # Timeline, TimelineNode, AddMemory
│   ├── bucket/                         # BucketList, BucketItem, AddBucket
│   ├── prompt/                         # DailyPrompt, PromptAnswer
│   ├── capsule/                        # CapsuleList, ComposeLetter, OpenLetter, lib/crypto.ts
│   ├── vibe/                           # VibeSync, MoodPicker, RealtimeVibe
│   ├── map/                            # UsMap (mapbox), PinDetail, AddPin
│   ├── constellation/                  # Sky, Star, MemoryTooltip
│   ├── whisper/                        # WhisperFeed, ComposeWhisper, ReadWhisper, FeelingChips
│   ├── mirror/                         # MirrorWeek, MirrorAnswer, MirrorReveal
│   ├── promises/                       # PromiseLedger, AddPromise, KeepPromise
│   ├── echo/                           # EchoCalendar, OnThisDay
│   ├── heartbeat/                      # HeartbeatPad, HeartbeatStream
│   ├── gratitude/                      # GratitudeTrail, GratitudeEntry
│   └── admin/                          # AdminQueue, CoupleCard, ApproveModal
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # createBrowserClient
│   │   └── types.ts                    # generated DB types
│   ├── queries/                        # all TanStack query hooks, one file per resource
│   ├── stores/                         # zustand stores
│   ├── hooks/                          # useCountdown, useRealtimeVibe, useCoupleState, useAdmin
│   ├── crypto.ts                       # client-side AES-GCM for capsule letters
│   └── i18n/                           # config, navigation
├── messages/
│   ├── en.json
│   └── ar.json
├── public/
│   ├── noise.svg
│   └── icons/
├── supabase/
│   ├── migrations/                     # *.sql files for schema + RLS
│   ├── functions/
│   │   ├── soften/index.ts             # Claude-powered soft rephrasing
│   │   ├── prompt-of-day/index.ts      # generate daily prompts
│   │   └── _shared/cors.ts
│   └── config.toml
├── .github/workflows/deploy.yml        # GitHub Pages CI
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Design System

### Tokens (in `globals.css` and `tailwind.config.ts`)

Three themes via `[data-theme]` on `<html>`. Always read colors through CSS variables.

```css
:root, [data-theme="dusk"] {
  --bg: #0a0a0f;  --surface: #14131a;  --surface-2: #1c1a22;
  --gold: #c9a961; --gold-bright: #e8c87a; --gold-deep: #8a6f3a;
  --ivory: #f5f1e8; --ivory-dim: #c9c2b5; --muted: #6b6660;
  --line: rgba(201, 169, 97, 0.18);
}
[data-theme="day"] {
  --bg: #f5f0e3; --surface: #fffaef; --surface-2: #ffffff;
  --gold: #a8843f; --gold-bright: #c9a961; --gold-deep: #6b552a;
  --ivory: #2a2520; --ivory-dim: #5a5048; --muted: #8a8278;
  --line: rgba(168, 132, 63, 0.22);
}
[data-theme="night"] {
  --bg: #0a0506; --surface: #150a08; --surface-2: #1c100c;
  --gold: #b08040; --gold-bright: #d4a060; --gold-deep: #7a5a2a;
  --ivory: #d4a574; --ivory-dim: #9a7858; --muted: #5a4538;
  --line: rgba(176, 128, 64, 0.15);
}
html, body { background: var(--bg); color: var(--ivory); transition: background-color .6s, color .6s; }
```

### Tailwind extend

```ts
colors: { bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface-2)', gold: 'var(--gold)', goldBright: 'var(--gold-bright)', goldDeep: 'var(--gold-deep)', ivory: 'var(--ivory)', ivoryDim: 'var(--ivory-dim)', muted: 'var(--muted)' },
fontFamily: {
  'display-en': ['var(--font-cormorant)', 'serif'],
  'display-ar': ['var(--font-aref-ruqaa)', 'serif'],
  'body-en':    ['var(--font-manrope)', 'sans-serif'],
  'body-ar':    ['var(--font-tajawal)', 'sans-serif'],
  'hand':       ['var(--font-caveat)', 'cursive'],
},
boxShadow: {
  pop:    'inset 0 1px 0 rgba(255,240,200,0.04), inset 0 -1px 0 rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
  popLg:  'inset 0 1px 0 rgba(255,240,200,0.05), inset 0 -1px 0 rgba(0,0,0,0.7), 0 20px 50px rgba(0,0,0,0.6)',
  gold:   '0 8px 20px rgba(201,169,97,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
},
```

### Fonts (Google, loaded via `next/font/google`)

- English display: **Cormorant Garamond**
- English body: **Manrope**
- Arabic display: **Aref Ruqaa**
- Arabic body: **Tajawal**
- Handwritten accent: **Caveat**

The `[locale]/layout.tsx` swaps body font based on locale.

### Motion principles

- Page entries: stagger fade-up with `cubic-bezier(0.2, 0.8, 0.2, 1)`, 0.15s offset per child
- Modal: bottom sheet on mobile, center modal on desktop (use Radix Dialog primitives)
- Theme transition: 600ms ease on all color-bearing properties
- Loading: shimmering gold gradient, never spinning circles
- Success: animated gold wax seal stamping (rotate + scale)

### RTL rules (strict)

Use **only** logical Tailwind utilities: `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`, `border-s-*`, `border-e-*`, `rounded-s-*`, `rounded-e-*`. Never `ml/mr/pl/pr/left/right/text-left/text-right`. Direction-aware icons get `rtl:rotate-180`.

---

## Database Schema (full SQL — drop into `supabase/migrations/00000000000000_init.sql`)

```sql
-- =========================
-- AUTH & COUPLE
-- =========================
create extension if not exists "pgcrypto";

create type couple_state as enum (
  'drafted', 'invited', 'mutual', 'pending_admin', 'approved', 'rejected'
);

create table couples (
  id uuid primary key default gen_random_uuid(),
  state couple_state not null default 'drafted',
  name_a text, name_b text,
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

-- helper function
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
  category text,                          -- travel / experience / home / etc
  notes text,
  position int not null default 0,
  completed_at timestamptz,
  memory_id uuid references memories,     -- linked memory when completed
  created_at timestamptz default now()
);

-- =========================
-- DAILY PROMPT
-- =========================
create table daily_prompts (
  id uuid primary key default gen_random_uuid(),
  prompt_en text not null,
  prompt_ar text not null,
  depth int default 1                     -- 1=light, 5=deep
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
  ciphertext text not null,               -- AES-GCM, key derived from couple secret
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
  mood text,                              -- 'tender','playful','tired','stressed','grateful','craving_you'
  energy int check (energy between 1 and 5),
  craving text,                           -- emoji or short phrase
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

-- =========================
-- WHISPER
-- =========================
create type whisper_feeling as enum (
  'unseen','distant','tender','weary','anxious','small','alone','frustrated','hurt','longing'
);
create type whisper_response as enum ('heard','tell_more','lets_talk');

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

create unique index one_whisper_per_day
  on whispers (author_id, (date_trunc('day', sent_at)));

-- =========================
-- MIRROR MODE
-- =========================
create table mirror_questions (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_ar text not null,
  category text                          -- love, dreams, growth, family
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
-- RLS
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

-- Generic "my couple OR admin" policy generator — apply to all couple-scoped tables
-- Example for memories:
create policy "members_or_admin_read" on memories for select using (
  couple_id = current_couple_id() or is_admin(auth.uid())
);
create policy "members_write" on memories for insert with check (couple_id = current_couple_id());
create policy "members_update" on memories for update using (couple_id = current_couple_id());
create policy "members_delete" on memories for delete using (couple_id = current_couple_id());
-- REPEAT THE SAME 4 POLICIES for: bucket_items, prompt_answers, capsule_letters,
-- vibe_pings, places, whispers, mirror_sessions, mirror_answers, promises,
-- promise_checks, heartbeats, gratitudes

-- daily_prompts and mirror_questions are public-read (templates, not user content)
create policy "anyone_read" on daily_prompts for select using (true);
create policy "anyone_read" on mirror_questions for select using (true);

-- couples table — special rules
create policy "members_read_own_couple" on couples for select using (
  id = current_couple_id() or is_admin(auth.uid())
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

-- admins
create policy "admins_read_all" on admins for select using (is_admin(auth.uid()) or user_id = auth.uid());

-- Whispers: deliverable read-rule
drop policy if exists "members_or_admin_read" on whispers;
create policy "whisper_read" on whispers for select using (
  (author_id = auth.uid())
  or (recipient_id = auth.uid() and deliver_at <= now())
);
create policy "whisper_insert" on whispers for insert with check (
  author_id = auth.uid() and couple_id = current_couple_id()
);
create policy "whisper_respond" on whispers for update using (recipient_id = auth.uid());

-- Capsule: locked until unlock_at
drop policy if exists "members_or_admin_read" on capsule_letters;
create policy "capsule_read" on capsule_letters for select using (
  couple_id = current_couple_id() and unlock_at <= now()
);
create policy "capsule_insert" on capsule_letters for insert with check (couple_id = current_couple_id());
```

---

## Auth Flow & Role Logic

### Roles
- **User** — a member of a couple. Default for everyone.
- **Admin** — also a user (and can be in their own couple), but their `user_id` is in the `admins` table. Sees `/admin/*` routes.
- The admin can have a couple too. The admin panel and the couple app coexist on the same login.

### Couple State Machine

```
        drafted ─create─→ invited ─accept─→ mutual ─submit─→ pending_admin
                                                                    │
                                                            ┌───────┴───────┐
                                                          bless          reject
                                                            │               │
                                                         approved        rejected ──resubmit──┐
                                                                                              │
                                                                                              ▼
                                                                                       pending_admin
```

### Client-side guard (replaces middleware)

```tsx
// components/route-guard.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { useCoupleState } from '@/lib/hooks/use-couple-state';

const PUBLIC = ['/', '/sign-in', '/invite', '/awaiting', '/rejected'];
const ADMIN  = ['/admin'];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { session, isAdmin, coupleState, loading } = useCoupleState();

  useEffect(() => {
    if (loading) return;
    if (!session) { if (!PUBLIC.some(p => path.startsWith(p))) router.replace('/sign-in'); return; }
    if (ADMIN.some(p => path.startsWith(p))) { if (!isAdmin) router.replace('/'); return; }
    if (coupleState === 'approved') return;
    if (!coupleState || coupleState === 'drafted') { if (path !== '/invite') router.replace('/invite'); return; }
    if (['invited','mutual','pending_admin'].includes(coupleState!) && path !== '/awaiting') { router.replace('/awaiting'); return; }
    if (coupleState === 'rejected' && path !== '/rejected') { router.replace('/rejected'); return; }
  }, [session, isAdmin, coupleState, loading, path, router]);

  if (loading) return <SealedLoading />;
  return <>{children}</>;
}
```

### Invite flow

1. User signs in (Supabase magic link). A row in `couple_members` is checked.
2. If none → `/invite` — form: my name, partner email, optional wedding date. On submit, INSERT into `couples` (state='drafted'), then UPDATE state='invited' with a generated 6-char `invite_code`. Email partner the code + a deep link `/accept/{code}`.
3. Partner clicks link, signs in, route auto-fills the code, sees initiator's name, confirms. UPDATE `couples` set partner_id, state='mutual'. Both can then submit for blessing → state='pending_admin'.
4. Admin sees the queue at `/admin/couples`. Blesses → state='approved'. Realtime channel notifies both partners.

---

## Internationalization

`next-intl` with locales `['en', 'ar']`. Default `en`. Routing: `/[locale]/...`. Use `<Link>` from `lib/i18n/navigation` everywhere.

In `app/[locale]/layout.tsx`: set `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>` and apply the correct `font-body-en` or `font-body-ar` class to `<body>`.

Translation files at `messages/en.json` and `messages/ar.json`. Use nested keys: `whisper.compose.title`, etc. Numbers and dates via `useFormatter()`. Always provide both locales for every string.

---

## Theme System

Three modes: `day | dusk | night`. Persisted to `localStorage`. Smart default: if `prefers-color-scheme: light` → `day`; else if hour ∈ [22, 6) → `night`; else `dusk`.

ThemeProvider sets `data-theme` on `<html>` and persists. ThemeSwitcher pill lives in the top app shell next to the LangSwitcher.

---

## Feature Specifications

For each feature, build: (a) a page route, (b) the components, (c) the TanStack Query hooks, (d) the Zod schemas for forms.

### 1. Hero + Countdown (`/`)
Names, ampersand, tagline, countdown to wedding date pulled from `couples.wedding_date`. Countdown unit cards have shadow-pop. Uses `useCountdown` hook with 1s interval.

### 2. Memory Timeline (`/timeline`)
Vertical scrollable timeline. Each memory: card with date in gold, caption in display font, optional image (Supabase Storage signed URL), optional place link. FAB to add. Filters: year, place, kind. Smooth scroll-snap on mobile.

### 3. Bucket List (`/bucket`)
Categorized list. Drag to reorder (use `@dnd-kit`). Tap to check off — satisfying gold seal animation. Completed items move to bottom with strike-through and link to a memory if attached.

### 4. Daily Prompt (`/prompt`)
Pulls a prompt for today's date (deterministic: `daily_prompts[hash(date) % count]`). Both partners answer independently. Once both have submitted, reveal both side-by-side. If only one has, show a quiet "waiting for your partner" state. New seed each day.

### 5. Time Capsule (`/capsule`)
List of letters, each showing recipient, lock date, and seal status (locked = closed envelope; unlocked = open). 

**Encryption**: derive key from a shared couple passphrase (set once at couple creation) using PBKDF2. Encrypt `body` with AES-GCM in the browser. Store only ciphertext + nonce. Decrypt in the browser when unlock_at ≤ now. Even Supabase admins cannot read.

```ts
// lib/crypto.ts
export async function encrypt(plain: string, passphrase: string) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return { ciphertext: btoa(String.fromCharCode(...new Uint8Array(ct))), nonce: btoa(String.fromCharCode(...iv, ...salt)) };
}
// decrypt is the inverse — split nonce + salt, derive same key, decrypt
```

### 6. Vibe Sync (`/vibe`)
Each partner sets: mood, energy 1–5, optional craving emoji/text. Their card appears on both screens via Supabase Realtime channel subscribed to the row. No notification spam — just ambient awareness.

### 7. The Us Map (`/map`)
Mapbox GL with custom dark style (provide a dark gold-tinted style URL). Pins: `visited`, `first_date`, `anniversary`, `home`, `dream`. Tap pin → bottom sheet with linked memory. Add via long-press → fill form. Globe view toggle.

### 8. Constellation (`/constellation`)
Canvas-based. Each memory becomes a star placed on a golden-ratio spiral. Connecting line between consecutive memories. Tap = tooltip with date + caption. Pinch-zoom and pan. *(Already coded — port from prior demo.)*

### 9. Whisper (`/whisper`)
The full flow already designed: 3-field compose → optional soften → 30-min delivery delay → receive screen → response. **One per day per author** enforced by unique index. Cooldown shown if already sent today. Soft-language hint calls Edge Function `/soften`.

### 10. Mirror Mode (`/mirror`)
Each Monday, a new question. Both partners answer privately. When both have submitted, the page reveals both answers side-by-side with a gold reveal animation. Archive of past mirror weeks at the bottom.

### 11. Promise Ledger (`/promises`)
List of active promises with cadence. Daily/weekly check-in prompts the author: "Did you keep this?" Yes → +1 kept_count + gold seal animation. No → +1 broken_count + a soft "tomorrow is new" message, no shaming. Both partners can see the ledger.

### 12. Echo Calendar (`/echo`)
"On this day" view. Shows any memories, prompt-answers, vibe-pings, whispers, or gratitudes from this calendar date in past years. Beautifully laid out as a vertical scroll of past today's.

### 13. Heartbeat (`/heartbeat`)
A single big gold button. Tap = sends one heartbeat to your partner. Partner gets a soft pulse animation in their app + ambient counter. Daily heartbeat count visible. No words, just presence.

### 14. Gratitude Trail (`/gratitude`)
One field: "Today I'm grateful for…" — submit. Partner can see. A trail builds: a flowing list of small gratitudes over time. Adds warmth to ambient parts of the app (random gratitude appears as a quiet footer line elsewhere).

### 15. Anniversary Engine (background — no dedicated page)
Computes: 30 days together, 100 days, 6 months, 1 year, every year, "the day you met", "the engagement day". When triggered (within ±1 day), a special banner appears on the dashboard with a custom message and a CTA to view that anniversary's constellation.

---

## Admin Panel (`/admin`)

Only accessible if `auth.uid()` is in `admins`.

### `/admin` — Dashboard
Stats: total couples, by state. Recent activity feed (admin-relevant only: new couple signups, blessings, rejections). NEVER show couple content (memories, whispers, etc) — admin sees only metadata.

### `/admin/couples` — Queue
Filterable list: all states, default to `pending_admin`. Card shows: names, wedding date, when submitted, optional note from couple. "Bless" and "Decline" buttons.

### `/admin/couples/[id]` — Review
Full metadata, both partners' display names + avatars + emails. Bless → updates state, sends Realtime ping. Decline → opens modal for reason → updates state + admin_note.

### Admin's own couple
The admin's normal app at `/` works the same — they're a regular user when not in `/admin/*`.

### Granting admin access
Done by SQL only: `insert into admins (user_id) values ('your-user-id');`. Never expose admin-creation in the UI.

---

## Supabase Edge Function: Soften (`supabase/functions/soften/index.ts`)

```ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Anthropic from 'npm:@anthropic-ai/sdk@0.27';
import { corsHeaders } from '../_shared/cors.ts';

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return new Response('unauthorized', { status: 401, headers: corsHeaders });

  const { text, locale } = await req.json();
  if (!text || typeof text !== 'string' || text.length > 1000) {
    return new Response('bad input', { status: 400, headers: corsHeaders });
  }

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: `You are a gentle couple's translator. Rewrite the user's message in I-statements, without accusations, absolutes ("always", "never"), or labels ("lazy", "selfish"). Keep their meaning intact; soften the edges so it lands with love. Match the language of the input (English or ${locale === 'ar' ? 'Arabic' : 'English'}). Return only the rewritten message, nothing else.`,
    messages: [{ role: 'user', content: text }],
  });

  const out = msg.content.find(b => b.type === 'text')?.text ?? text;
  return new Response(JSON.stringify({ softened: out }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

Set the secret: `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`

---

## Quality Standards

- **Accessibility**: every interactive element keyboard-reachable; ARIA labels on icon buttons; focus rings visible (gold ring); `prefers-reduced-motion` disables non-essential animations.
- **Performance**: lazy-load Mapbox, Constellation canvas, capsule crypto. First load JS budget: < 200kb gzipped for dashboard.
- **TypeScript**: strict mode, no `any`, generate Supabase types via `supabase gen types typescript`.
- **State**: all server state through TanStack Query; all forms through React Hook Form + Zod; no `useState` for server data.
- **Errors**: every mutation has `onError` showing a gold-bordered toast. Network errors retry with backoff (TanStack default).
- **Empty states**: every list has a beautiful empty state, never just "no data."
- **Mobile-first**: tested at 375px width minimum; touch targets ≥ 44px; bottom-sheet modals on small screens.

---

## Build Order (milestones)

**M1 — Skeleton (1 day)**
1. Init Next.js, Tailwind, Supabase, next-intl, TanStack Query
2. `next.config.js` with static export
3. Three themes + theme switcher
4. EN/AR i18n + language switcher with RTL flip
5. `globals.css` with all tokens
6. AmbientStars background
7. Empty `<RouteGuard>` shell

**M2 — Auth & Admin (2 days)**
8. Sign-in with magic link
9. Invite flow (`/invite` → `/accept/[code]` → `/awaiting`)
10. Admin panel with approval queue
11. RouteGuard fully wired with all states
12. SealedLoading / Awaiting Blessing / Rejected screens

**M3 — Hero & First Joy (1 day)**
13. Dashboard with Hero + Countdown
14. Module grid linking to all feature pages (stubs ok)
15. Anniversary Engine background banner

**M4 — Daily Use Features (3 days)**
16. Vibe Sync (realtime)
17. Daily Prompt
18. Heartbeat
19. Gratitude Trail
20. Whisper (full flow + Soften edge function)

**M5 — Memory Features (3 days)**
21. Memory Timeline + add/edit
22. Constellation
23. Echo Calendar
24. Bucket List

**M6 — Depth Features (3 days)**
25. Time Capsule with client-side encryption
26. Mirror Mode
27. Promise Ledger
28. Us Map (Mapbox)

**M7 — Polish (2 days)**
29. All empty states
30. All loading states
31. Accessibility audit
32. Lighthouse pass: aim for 95+ on all categories
33. PWA manifest + offline shell

**M8 — Deploy**
34. GitHub Actions workflow
35. Custom domain (optional)
36. Smoke-test on the deployed URL

---

## First Command to Claude Code

After pasting this whole document, end with:

> Begin M1. Initialize the project, write `next.config.js`, `tailwind.config.ts`, `globals.css` with all three theme tokens, and the `[locale]/layout.tsx` with both font families and dir-switching. Stop after M1 for my review.

Then iterate milestone by milestone, reviewing after each.
