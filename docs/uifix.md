# Typography + mobile responsiveness + tutorial blackout fix + animated romantic background

## Context

Four asks on top of the now-working app:

1. **Localized display fonts** (local files in `app/fonts/`):
   - English headers → **Playfair Display** (replaces Cormorant Garamond).
   - Arabic headers **and couple names** → **Aref Ruqaa**; the couple-name separator `&` becomes **`و`** in Arabic.
   - Arabic body / subtitles / descriptions → **Tajawal** (unchanged role).
   - English body → Manrope (unchanged).
2. **Full mobile responsiveness pass** — sizing/layout across the system on phones.
3. **Tutorial still blacks out the page after signup**, and **tab clicks feel laggy**. Plus a performance recommendation (the user accepts that local dev is slower than prod).
4. **Animated, romantic, theme-aware background** across the whole app (Framer-Motion, like the intro), confirmed **per-theme accent** style.

**Confirmed root cause of the "empty page" tutorial bug:** [components/tutorial/tutorial-overlay.tsx](components/tutorial/tutorial-overlay.tsx) builds an SVG mask that fills the viewport with `rgba(0,0,0,0.78)` and only subtracts a spotlight hole **when `highlightRect` exists**. [tutorial-provider.tsx](components/tutorial/tutorial-provider.tsx) `computeRect()` queries `[data-tutorial-id="home-hero"]` **once**; if the element isn't in the DOM yet (fresh signup, or the `/`→`/invite` redirect race), `highlightRect` stays `null` → the whole screen is dimmed to near-black → looks empty.

---

## Part A — Localized typography (local fonts)

Local files confirmed present: `app/fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf`, `app/fonts/Aref_Ruqaa/ArefRuqaa-{Regular,Bold}.ttf`, `app/fonts/Tajawal/Tajawal-*.ttf`.

- [app/[locale]/layout.tsx](app/[locale]/layout.tsx): replace the `Cormorant_Garamond` google import with `next/font/local` declarations:
  - `playfair` → variable font → CSS var `--font-playfair`
  - `arefRuqaa` → Regular(400)+Bold(700) → `--font-aref-ruqaa`
  - `tajawal` → local Light/Regular/Medium/Bold → `--font-tajawal` (replaces the google Tajawal so the family is consistent and offline)
  - Keep Manrope + Caveat from google. Update the root `<div>` className list: drop `cormorant.variable`, add `playfair.variable` + `arefRuqaa.variable`.
- [tailwind.config.ts](tailwind.config.ts) `fontFamily`:
  - `display-en` → `['var(--font-playfair)', 'serif']`
  - `display-ar` → `['var(--font-aref-ruqaa)', 'serif']` (var is now actually wired)
  - `body-ar` stays `var(--font-tajawal)`, `body-en` stays Manrope.
- [app/globals.css](app/globals.css): the existing RTL override `[dir='rtl'] .font-display-en:not(.brand-latin)` currently points at `var(--font-tajawal), 'Aref Ruqaa'` → change to **`var(--font-aref-ruqaa), serif`** so every Arabic header renders in Aref Ruqaa. (Body/subtitles keep `font-body-ar` = Tajawal — unchanged.)
- Couple-name separator: in [components/hero/hero.tsx:35](components/hero/hero.tsx#L35) and [app/[locale]/admin/couples/page.tsx](app/[locale]/admin/couples/page.tsx) (two `&amp;` spots), render `{isArabic ? 'و' : '&'}` instead of the hard-coded `&amp;`. `isArabic` already exists in both files.

Net effect: English titles → Playfair; Arabic titles + names → Aref Ruqaa with `و`; all body text unchanged. The `brand-latin` "Forever" wordmark stays Latin (now Playfair).

---

## Part B — Tutorial: never black out; wait for the real target

Make it structurally impossible to dim the whole page over a missing target.

- [components/tutorial/tutorial-provider.tsx](components/tutorial/tutorial-provider.tsx) `computeRect()`: **retry** finding the element with `requestAnimationFrame`/timeout (e.g. up to ~1.5 s, ~12 tries). Only set `highlightRect` once found. Expose whether a target was resolved.
- [components/tutorial/tutorial-overlay.tsx](components/tutorial/tutorial-overlay.tsx): when `highlightRect` is `null`, **do not render the 0.78 black mask**. Render a light, blurred backdrop (e.g. `bg-bg/40 backdrop-blur-sm`) so content stays visible, and center the tooltip. The hard spotlight scrim only renders when there's a real rect.
- Start robustly: in [components/tutorial/use-tutorial.ts](components/tutorial/use-tutorial.ts), only call `startTutorial` when `enabled` AND the first step's element exists in the DOM (quick `document.querySelector` check inside the timer); cancel cleanly on route change/unmount so a started tutorial can't linger after a redirect.
- The dashboard already gates `enabled={!!couple}` ([app/[locale]/page.tsx](app/[locale]/page.tsx)); keep it. A freshly-signed-up user with no couple is redirected to `/invite` by RouteGuard and the home tutorial simply never starts.

Result: the page can never go fully black behind the tutorial; the tutorial only spotlights elements that actually exist.

---

## Part C — Tab lag + performance

- Sign-in tabs ([app/[locale]/(auth)/sign-in/page.tsx](app/[locale]/(auth)/sign-in/page.tsx)): memoize the resolvers (`const r = useMemo(() => zodResolver(schema), [])`) and **shorten the tab transitions** (the `AnimatePresence mode="wait"` exit/enter are 0.25 s / 0.2 s → cut to ~0.12 s) so switching feels instant. Same for the sign-in/sign-up sub-tab slide.
- Keep the perceived-lag explanation (Part E) front-and-center: most "click → wait" is **`next dev` on-demand route compilation** + Windows/Docker file-watch polling, not the code.

---

## Part D — Animated romantic background (per-theme accent)

- **New** `components/layout/romantic-background.tsx`: `fixed inset-0 -z-[1] pointer-events-none`. Renders 2–3 large, heavily-blurred radial-gradient "glow" blobs that slowly drift (Framer-Motion `x/y/scale` loops) plus a few slow floating hearts. All loops gated by [useRespectfulMotion](lib/hooks/use-respectful-motion.ts) (`repeat`), so reduced-motion / hidden-tab → static. Keep element count tiny (GPU transforms + `willChange`).
- **Per-theme palette:** add CSS vars `--glow-1` / `--glow-2` to each theme block in [app/globals.css](app/globals.css) (`[data-theme='dusk'|'day'|'night']`) — dusk=gold, day=warm rose, night=deep amber. The blobs use these vars, so the background re-tints automatically when the theme switches (no JS).
- Mount in [app/[locale]/layout.tsx](app/[locale]/layout.tsx) between `<AmbientStars />` and `<AppShell>` (keep the starfield; the glow layer sits behind content, above body bg).
- Make `<PageTransition>` feel of-a-piece: it already fades opacity (reduced from last task); leave as-is so the new bg shows through smoothly.

---

## Part E — Mobile responsiveness pass

Audit + fix across pages; the recurring fixes:

- **Header** [components/layout/app-shell.tsx](components/layout/app-shell.tsx): it crowds ~375 px (logo 110×60 + "Forever" text-2xl + `?` + 3 theme buttons + lang + avatar). Fixes: smaller logo on mobile (`w-[72px]` → `md:w-[110px]` via responsive classes/`sizes`), hide the wordmark below `sm` (`hidden sm:inline`), tighten gaps, and bump the 28 px buttons to ~36 px tap targets. Ensure the row never overflows (`flex-wrap`/`shrink-0` as needed). Adjust the `pt-24` main offset if the header height changes on mobile.
- **Account** [app/[locale]/account/page.tsx](app/[locale]/account/page.tsx): `grid-cols-2` name pairs → `grid-cols-1 sm:grid-cols-2`.
- **Hero** [components/hero/hero.tsx](components/hero/hero.tsx): names `text-5xl md:text-7xl` → `text-4xl sm:text-5xl md:text-7xl` so two names + separator don't wrap awkwardly on small phones.
- **Module grid** [components/layout/module-grid.tsx](components/layout/module-grid.tsx): fine at `grid-cols-2`; verify padding/tap size on 320 px.
- **General sweep:** check each route under `app/[locale]/` for fixed widths/overflow (`w-[`, wide `min-w-`, tables, the map/canvas pages), confirm every page container uses `px-4` + `max-w-*` and scrolls cleanly at 375 px. Fix any horizontal-scroll offenders found. Verify the sign-in glass card and admin two-column layout stack on mobile (`lg:grid-cols-2` already collapses — confirm).

---

## Performance recommendation (answer to the user's question)

Most of the "clicking a tab/page takes time" is **local-dev only**, not your code or the server:
- `next dev` compiles each route **on first visit** (on-demand) — the first click to a page is slow, repeat visits are instant.
- On Windows + Docker, `WATCHPACK_POLLING=true` (needed for hot-reload over the bind mount) makes the dev server poll the filesystem — extra CPU.
- Dev also runs React double-render (Strict Mode), no minification, and live source maps.

In production you already have `output: 'standalone'` (`next start` / the Node image) which **precompiles every route** — navigation is near-instant, no per-click compile. **To feel real performance locally, run the prod image** (`docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d`) or `npm run build && npm start`, not `next dev`. The code fixes above (centralized state from last task, lighter tab transitions, cheap background) remove the genuine app-side costs; the rest is the dev server and the EC2 box will be much faster.

---

## Files changed / new

**NEW**
- `components/layout/romantic-background.tsx` — per-theme animated glow layer

**MODIFIED**
- `app/[locale]/layout.tsx` — local fonts (Playfair/Aref Ruqaa/Tajawal) + mount romantic background
- `tailwind.config.ts` — `display-en`→Playfair, `display-ar`→Aref Ruqaa
- `app/globals.css` — RTL header override → Aref Ruqaa; add `--glow-*` per theme
- `components/hero/hero.tsx`, `app/[locale]/admin/couples/page.tsx` — `&`→`و` in Arabic + (hero) responsive name sizes
- `components/tutorial/tutorial-overlay.tsx` + `tutorial-provider.tsx` + `use-tutorial.ts` — no-blackout + target-wait + safe start
- `app/[locale]/(auth)/sign-in/page.tsx` — memoized resolvers + faster tab transitions
- `components/layout/app-shell.tsx`, `app/[locale]/account/page.tsx`, plus responsive tweaks on pages found to overflow

---

## Verification

Run dev (`docker compose --env-file .env.docker up -d`, app on :3000); for perf, also smoke-test the prod image.

1. **Fonts** — EN dashboard headers render in Playfair; switch to AR: headers + couple names render in Aref Ruqaa and the separator shows `و`; body/subtitles stay Tajawal. No FOUT/missing-glyph boxes.
2. **Tutorial** — fresh signup → lands on `/invite`, no home tutorial, **page never goes black**. As an approved couple, the tutorial starts only after Hero+grid are visible and each step spotlights a real element; if a target is ever missing it shows a light backdrop, not a blackout. Clear `localStorage` to retest.
3. **Tabs** — sign-in magic/password tabs switch instantly (no ~250 ms stall); sign-in/sign-up sub-tabs too.
4. **Background** — subtle gold glows drift behind every page; switching theme (dusk/day/night) re-tints the glow (gold/rose/amber); `prefers-reduced-motion` → static gradient, no loops.
5. **Mobile (DevTools 375 px + 320 px)** — header fits with no overflow/wrap-break and tap targets ≥ ~36 px; account fields stack; hero names don't break awkwardly; every route scrolls vertically only (no horizontal scroll); sign-in card and admin panel stack.
6. **Build** — `npx tsc --noEmit` clean; `npx next build` passes with lint and emits `.next/standalone`.
