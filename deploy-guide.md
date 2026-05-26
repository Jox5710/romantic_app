# FOREVER — Deployment Guide

Two paths. Pick one. **Path B (Vercel) is genuinely better for this app** — read both before choosing.

---

## ⚠ Read this first — about GitHub Pages

GitHub Pages can deploy your app, BUT:

1. **Anyone with the URL can load it.** The `*.github.io` URL is guessable (it's your username). You cannot password-protect a GitHub Pages site — only Supabase Auth keeps people out of the data. Make sure your RLS policies are airtight.
2. **Repo visibility ≠ site visibility.** Even if your repo is private (paid GitHub plan), the published *site* is still public. Your code is private; your URL is public.
3. **The Supabase `anon` key will be in your JS bundle.** That's by design — Supabase publishable keys are safe to expose *as long as RLS is on every table*. Treat RLS as your only defense.
4. **No server features work** (we already designed around this).

If any of this makes you nervous, use Path B.

---

## PATH A — GitHub Pages (static)

### Step 1 · Supabase project (do this once, in the cloud)

1. Go to <https://supabase.com> → New project. Name it "forever", pick a region near you.
2. In the SQL editor, paste the `00000000000000_init.sql` migration from the build spec. Run it.
3. **Auth → Providers**: enable Email (magic link). Disable signup if you want to manually create users.
4. **Auth → URL Configuration**: set Site URL to `https://<your-username>.github.io/<repo-name>/` (with trailing slash). Add the same to redirect URLs, plus `http://localhost:3000/` for local dev.
5. **Project Settings → API**: copy the **Project URL** and the **anon public key**. Keep them.
6. Create your admin user:
   - Sign up via the deployed app (or via SQL: `select auth.email_signup(...)`)
   - Get your user id from `auth.users`
   - Run: `insert into admins (user_id) values ('<your-user-id>');`
7. Deploy the Edge Function for soft-rephrasing:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy soften
   ```

### Step 2 · GitHub repo

```bash
# in your project root
git init
git add .
git commit -m "initial: forever"
gh repo create forever --private --source=. --push
# or do this via github.com manually
```

### Step 3 · Configure Next.js for GitHub Pages

`next.config.js` (already in spec, repeated here for clarity):

```js
module.exports = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};
```

If your repo is named `forever`, your URL will be `https://<user>.github.io/forever/`. Set `NEXT_PUBLIC_BASE_PATH=/forever` in CI.

If you use a custom domain or deploy to `<user>.github.io` (the user-page repo), leave `basePath` empty.

### Step 4 · GitHub Secrets

Repo → Settings → Secrets and variables → Actions → New repository secret. Add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | (optional, for the Us Map) |
| `NEXT_PUBLIC_BASE_PATH` | `/forever` (if project-page repo) |

### Step 5 · GitHub Actions workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install
        run: npm ci

      - name: Build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_MAPBOX_TOKEN: ${{ secrets.NEXT_PUBLIC_MAPBOX_TOKEN }}
          NEXT_PUBLIC_BASE_PATH: ${{ secrets.NEXT_PUBLIC_BASE_PATH }}
        run: npm run build

      - name: Add .nojekyll
        run: touch out/.nojekyll

      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Step 6 · Enable Pages

Repo → Settings → Pages → Source: **GitHub Actions** (not "Deploy from branch").

### Step 7 · Push and watch it build

```bash
git push origin main
```

Open the Actions tab. First build takes ~2 minutes. When green, click the URL from the deploy step.

### Step 8 · (Optional) Custom domain

Buy a quiet domain like `us.forever` or `<yourname>.love`. In your repo: Settings → Pages → Custom domain → enter `forever.yourname.com` (or your apex). At your DNS provider, point a CNAME to `<user>.github.io`. Update Supabase Auth → URL config with the new domain.

### Step 9 · Privacy hardening

- In `app/[locale]/layout.tsx` add `<meta name="robots" content="noindex, nofollow" />` so search engines don't index it.
- Add a `robots.txt` in `public/` with `User-agent: *\nDisallow: /`.
- Triple-check every Supabase table has RLS enabled. Run this in SQL editor:
  ```sql
  select tablename, rowsecurity from pg_tables where schemaname='public';
  ```
  Every row should show `rowsecurity = true`.

---

## PATH B — Vercel (recommended)

Same Supabase setup as steps 1, 6, 7 above. Then:

### Step 1 · Push to GitHub (private repo, just for source storage)

```bash
gh repo create forever --private --source=. --push
```

### Step 2 · Import to Vercel

1. <https://vercel.com> → Add New → Project → Import your repo
2. Framework preset: **Next.js** (auto-detected). Leave build settings as default — DO NOT set `output: export`. Vercel runs full Next.js. Remove that line from `next.config.js` for Vercel.
3. Add environment variables (the same `NEXT_PUBLIC_*` ones).
4. Deploy.

### Step 3 · Lock it down

Vercel → your project → Settings → **Deployment Protection**:
- For Hobby plan: turn on **Vercel Authentication** — only emails you whitelist can load the site. This is the single best feature for a private app.
- Or: **Password Protection** (Pro plan).

### Step 4 · Custom domain (free with Vercel)

Domains tab → add your domain → follow DNS instructions.

You're done. Vercel auto-deploys on every `git push`.

---

## Why I recommend Vercel

| Concern | GitHub Pages | Vercel |
|---|---|---|
| Cost | Free | Free |
| Privacy | Public URL, RLS-only | Deployment Protection: actual whitelist |
| Server features (middleware, API routes, server actions) | None | All |
| Build time | ~2min | ~1min |
| Preview deployments | No | Every PR |
| Edge Functions | Need Supabase Edge Functions | Native, also Supabase Edge Functions |
| Custom domain | Free, manual DNS | Free, guided |

The only reason to choose GitHub Pages is if you want everything in one ecosystem (GitHub-only). For a private couple's app, the *Deployment Protection* on Vercel is genuinely the right safety net.

---

## Post-deploy checklist

- [ ] Sign in as yourself, create your couple, get the admin row inserted
- [ ] Send invite to your partner's email
- [ ] Partner accepts, both confirm, submit for blessing
- [ ] Open admin panel, bless your own couple (yes, you bless yourself — it's allowed)
- [ ] Set your wedding date in the couple settings
- [ ] Verify countdown is ticking on the dashboard
- [ ] Add a memory, see it in the timeline AND the constellation
- [ ] Send a test whisper to yourself, confirm 30-min delay works
- [ ] Switch to Arabic, verify full RTL flip
- [ ] Switch through all three themes
- [ ] Test on your partner's phone (different screen, different OS)
- [ ] Tell your partner you built this.

---

## Maintenance

```bash
# pull schema changes from production
supabase db pull

# deploy schema changes
supabase db push

# regenerate TypeScript types after schema change
supabase gen types typescript --linked > lib/supabase/types.ts

# deploy an updated edge function
supabase functions deploy soften
```

When you `git push main`, the workflow rebuilds and redeploys automatically. The wedding date, partners' names, and all your content live in Supabase — they survive redeploys.

---

## Costs

| Service | Free tier | When you outgrow it |
|---|---|---|
| GitHub Pages / Vercel | Free forever for personal | n/a for one couple |
| Supabase | 500MB DB, 1GB storage, 50k MAU | Photos > 1GB — unlikely for years |
| Mapbox | 50k loads/mo | n/a |
| Anthropic API (soften feature) | Pay-per-use | Pennies/month at this scale |
| Domain (optional) | $10–15/year | — |

Total: **$0–15/year** for one couple, forever.

---

The build spec is the brain. This guide is the spine. Paste the spec into Claude Code, follow the milestones, then come back here for deploy. You've got everything you need.
