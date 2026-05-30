# Forever — Manual QA Checklist

Things that need a real browser to validate (the source-level audit already covered
loading states, error handling, and hardcoded strings). Run through these after any
significant change.

Local stack: `docker compose --env-file .env.docker up -d` → app at http://localhost:3000.
MailHog (magic links) at http://localhost:8025.

---

## 1. Golden path (new couple)

- [ ] Open `/` → splash plays once → lands on `/en/sign-in`
- [ ] Sign up (password tab) with a new email → button shows spinner → success
- [ ] Auto-redirect: full-screen "Opening your sanctuary…" overlay → `/invite`
- [ ] Fill invite form (name + partner email) → "Send invitation" shows spinner → `/awaiting`
- [ ] In a second browser/incognito, accept the invite link → "Accept invitation" spinner → `/awaiting`
- [ ] Sign in as `admin@fromantic.com` / `jox@12345` → `/admin` → `/admin/couples` → "Bless" → spinner
- [ ] Back in the couple's tab, `/awaiting` auto-redirects to `/` (dashboard) via realtime

## 2. Admin flow

- [ ] `/admin` shows stats (total / pending / approved / rejected)
- [ ] `/admin/couples` lists couples; empty state reads "No couples found" (localized)
- [ ] Bless / Decline buttons each show their own spinner and refresh the list
- [ ] A non-admin user visiting `/admin` is redirected to `/`

## 3. Header user menu (Part D)

- [ ] Signed in: avatar button appears top-right
- [ ] Click → popover shows email + "Couple settings" + "Sign out"
- [ ] "Couple settings" → `/account`; edit names + wedding date → Save shows spinner → toast
- [ ] "Sign out" → full-screen overlay → `/sign-in`; menu is now hidden
- [ ] Keyboard: Tab to the avatar, Enter opens, Esc closes

## 4. Bilingual names (Part E)

- [ ] As the demo couple, hero shows `Youssef & Nourhan` in EN (serif Latin face)
- [ ] Switch header language EN → AR: hero shows `يوسف & نورهان` in the Arabic display face
- [ ] `/admin/couples` row + detail panel show the locale-appropriate names
- [ ] Edit Arabic names in `/account`, refresh → both locales reflect the change
- [ ] A couple with no Arabic name set falls back to the Latin name in AR (no blanks)

## 5. Realtime (needs the tenant seeded — see DEPLOYMENT.md / seed-realtime-tenant.js)

- [ ] Open `/heartbeat` in two tabs as the paired couple → tap in one → other pulses, no refresh
- [ ] `/vibe` mood change in one tab reflects in the other
- [ ] DevTools → Network → WS → `ws://localhost:8000/realtime/v1/websocket` is `101` and stays open

## 6. Theme (day / dusk / night)

- [ ] Header theme switcher cycles all three
- [ ] Sign-in glassmorphism card stays readable in **day** (light) mode — text not washed out
- [ ] Dashboard, admin pages, account page all legible in each theme
- [ ] Gold accents and gradients adapt (no hardcoded dark-only colors leaking through)

## 7. Locale / RTL (en ↔ ar)

- [ ] Switch to AR: layout flips to RTL (`dir="rtl"`)
- [ ] Sign-in tab indicator slides toward the correct (start) side
- [ ] Google / Apple OAuth icons are NOT mirrored
- [ ] Header user-menu popover opens on the start side in both locales
- [ ] Hero `&` sits correctly between the two names in both directions
- [ ] Arabic display text uses the Aref Ruqaa / Tajawal face, not the Latin serif

## 8. Reduced motion (accessibility + perf)

- [ ] DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce"
- [ ] Splash: particles/hearts/rings do NOT loop (entrance still plays once)
- [ ] Sign-in: floating particles are static; pulsing rings stop
- [ ] Page transitions are instant (no fade)
- [ ] Turn emulation off → animations resume

## 9. Tab-visibility pause (perf)

- [ ] On `/sign-in` (lots of particles), switch to another tab for ~30s, switch back
- [ ] No jank / frame spike on return (loops were paused while hidden)
- [ ] DevTools Performance recording during idle shows no long tasks > 50ms

## 10. Loading feedback on slow network

- [ ] DevTools → Network → Slow 3G
- [ ] Every submit button (sign-in, invite, accept, awaiting "submit for review",
      account save, admin bless/decline) shows a spinner for the whole request
- [ ] Every redirect button (rejected "sign in again", user-menu "sign out")
      shows the full-screen overlay until the next page paints
- [ ] No button is silently clickable-but-frozen

---

## Automated coverage (Playwright)

Most of the above is also enforced by a Playwright suite living in
[`tests/e2e/`](../tests/e2e/) and run inside a dedicated container.

Run before each deploy:

```sh
pwsh ./test-e2e.ps1                            # full suite
pwsh ./test-e2e.ps1 auth.spec.ts               # one spec
pwsh ./test-e2e.ps1 --project=chromium-mobile  # mobile only
```

The container builds once (`docker compose -f docker-compose.test.yml build`);
subsequent runs reuse the bind-mounted specs without rebuild.

Outputs in `playwright-report/`:
- `index.html` — full report (traces, videos, screenshots).
- `SUMMARY.md` — failures bucketed by **P0/P1/P2/P3** with suggested fix locations.
- `junit.xml` — machine-readable.

The suite covers the same flows as this checklist plus API contract checks (Kong CORS,
realtime WS handshake, sign-in token shape) and 6 viewport projects across 3 browsers.

**Deployment gate:** treat a green run as the precondition for shipping.
A red P0/P1 failure means do not deploy until fixed.

---

## Known non-blocking notes

- The `next build` ESLint step has pre-existing warnings/errors in
  `components/tutorial/tutorial-overlay.tsx` and `components/map/us-map.tsx`
  (unrelated to this work). Build with `next build --no-lint` or fix separately.
- Realtime requires the tenant row to be seeded once per fresh DB
  (`docker exec … node /app/supabase/seed-realtime-tenant.js`).
