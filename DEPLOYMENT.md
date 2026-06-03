# Forever — Deployment Guide (GitHub → EC2)

Every push to `main` builds a Docker image, pushes it to GitHub Container Registry
(GHCR), and rolls it out to a single EC2 box running the full Supabase + Next.js
stack. Authentication between GitHub and AWS uses OIDC (no long-lived AWS keys), and
the rollout runs via AWS Systems Manager (no SSH key to expose).

---

## 1. Architecture

```
                          ┌──────────────────────────────────────────────┐
   git push main          │                  EC2 (t3.medium)              │
        │                 │                                                │
        ▼                 │   ┌─────────┐    :443   ┌────────────────────┐ │
 ┌───────────────┐  OIDC  │   │  Caddy  │◀──────────│  app (node :3000)  │ │  Next.js
 │ GitHub Actions│───────▶│   │  (TLS)  │           │  standalone server │ │  server
 │  build → GHCR │  SSM   │   └────┬────┘           └────────────────────┘ │
 └───────┬───────┘ RunCmd │        │ /api → :8000                          │
         │ docker pull    │        ▼                                       │
         ▼                │   ┌─────────┐  ┌──────┐ ┌──────┐ ┌──────────┐  │
   ghcr.io/<repo>:tag ───▶│   │  Kong   │─▶│ auth │ │ rest │ │ realtime │  │
                          │   │ gateway │  └──────┘ └──────┘ └──────────┘  │
                          │   └─────────┘        │       │        │        │
                          │                      ▼       ▼        ▼        │
                          │                  ┌────────────────────────┐    │
                          │                  │   postgres + storage    │    │
                          │                  └────────────────────────┘    │
                          └──────────────────────────────────────────────┘
        users ──── https://forever.example.com ───────────────▲
              ──── https://api.forever.example.com (Kong) ─────┘
```

The browser loads the app from the Next.js server (`app:3000`) and talks to Supabase
through `api.forever.example.com` → Kong. Realtime, auth, rest, and storage all sit behind Kong.

---

## 2. Prerequisites

- An **AWS account** with permission to create EC2, IAM, and (optionally) Route 53 resources
- A **domain** you control (Route 53 hosted zone or any registrar where you can set A-records)
- This repo on **GitHub** (the workflow uses GHCR, which is free for the repo)
- `docker` locally is handy for troubleshooting but not required for deploys

---

## 3. One-time AWS setup

### 3a. Launch the EC2 instance

| Setting | Value |
|---|---|
| AMI | **Amazon Linux 2023** (SSM agent preinstalled) |
| Instance type | **t3.medium** (2 vCPU / 4 GB — the stack runs ~11 containers) |
| Storage | **30 GB gp3** |
| Public IP | Allocate + associate an **Elastic IP** (stable address) |

### 3b. Security group `forever-sg`

| Port | Source | Purpose |
|---|---|---|
| 80  | `0.0.0.0/0` | HTTP (Caddy redirects to 443) |
| 443 | `0.0.0.0/0` (TCP **and** UDP for HTTP/3) | HTTPS |
| 22  | **your IP only** | SSH (emergency; SSM is primary) |

Do **not** expose 5432 / 8000 / 4000 / 8025 publicly — everything goes through 443.

### 3c. EC2 instance role

Create an IAM role for EC2 with the managed policy **`AmazonSSMManagedInstanceCore`**
and attach it as the instance profile. This lets GitHub reach the box via SSM with no keys.

### 3d. GitHub OIDC provider + deploy role

1. IAM → Identity providers → **Add provider** → OpenID Connect
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. IAM → Roles → **Create role** → Web identity → the provider above. Trust policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
         "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<GH_ORG>/<REPO>:ref:refs/heads/main" }
       }
     }]
   }
   ```
   This restricts the role to pushes on `main` of *that exact repo*.
3. Attach a minimal inline policy (replace region/account/instance):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       { "Effect": "Allow", "Action": "ssm:SendCommand",
         "Resource": [
           "arn:aws:ec2:<REGION>:<ACCOUNT_ID>:instance/<INSTANCE_ID>",
           "arn:aws:ssm:<REGION>::document/AWS-RunShellScript"
         ] },
       { "Effect": "Allow", "Action": ["ssm:GetCommandInvocation","ssm:ListCommandInvocations"], "Resource": "*" }
     ]
   }
   ```
   Note the role ARN — it becomes the `AWS_DEPLOY_ROLE_ARN` GitHub variable.

---

## 4. Bootstrap the EC2 box (one time)

Connect via SSM Session Manager (EC2 console → Connect → Session Manager) or SSH, then:

```sh
sudo dnf install -y git docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# docker compose v2 plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Clone into /opt/forever
sudo mkdir -p /opt/forever && sudo chown ec2-user:ec2-user /opt/forever
cd /opt/forever
git clone https://github.com/<GH_ORG>/<REPO>.git .

# Production secrets — NEVER commit this file
cp .env.docker .env.production
```

Edit `.env.production`:

```sh
# Generate a fresh JWT secret + matching keys (run locally with PowerShell):
#   pwsh supabase/keygen.ps1 -JwtSecret "<your-32+char-secret>"
# Paste the three values it prints:
JWT_SECRET=<your-strong-secret>
ANON_KEY=<printed anon key>
SERVICE_ROLE_KEY=<printed service_role key>

POSTGRES_PASSWORD=<strong-db-password>

# Public URLs the browser will hit (must be HTTPS, via Caddy → Kong):
SUPABASE_PUBLIC_URL=https://api.forever.example.com

# Real SMTP (not MailHog) for magic links / confirmations:
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
ENABLE_EMAIL_AUTOCONFIRM=false   # true only if you want to skip email confirmation
```

> **Important:** `JWT_SECRET`, `ANON_KEY`, and `SERVICE_ROLE_KEY` must all be
> generated together by `supabase/keygen.ps1`. If the secret doesn't match the keys,
> realtime WebSockets fail with `signature_error` and the admin API returns `bad_jwt`.
> The same `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set as a GitHub **variable** (§7)
> because it is baked into the static build.

Log in to GHCR so `docker compose pull` can fetch the image (one time; Docker stores it):

```sh
echo "<GHCR_READ_PAT>" | docker login ghcr.io -u <GH_USER> --password-stdin
```

`<GHCR_READ_PAT>` = a GitHub Personal Access Token with `read:packages`. (Or make the
GHCR package public — §7.4 — and skip the login entirely.)

First start (uses the prod override + Caddy):

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 5. Caddy + DNS

Edit [Caddyfile](Caddyfile) and replace the example domains:

```
forever.example.com      { encode zstd gzip   reverse_proxy app:3000 }
api.forever.example.com  { encode zstd gzip   reverse_proxy kong:8000 }
```

Create DNS A-records pointing both subdomains at the EC2 **Elastic IP**:

```
forever.example.com.      A   <ELASTIC_IP>
api.forever.example.com.  A   <ELASTIC_IP>
```

Caddy provisions Let's Encrypt certs automatically once 80/443 are reachable and DNS resolves.

---

## 6. Seed realtime tenant + publication (one time per fresh DB)

Realtime v2 is multi-tenant and rejects every WebSocket until its tenant row exists.

```sh
cd /opt/forever

# 1. Postgres publication the CDC extension subscribes to
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" <db-container> \
  psql -U postgres -d postgres \
  -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN CREATE PUBLICATION supabase_realtime FOR ALL TABLES; END IF; END \$\$;"

# 2. Tenant row (idempotent — 'already exists' on rerun is fine)
docker exec -e JWT_SECRET="$JWT_SECRET" -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  <app-container> node /app/supabase/seed-realtime-tenant.js
```

Find the container names with `docker compose ps`. Also seed the admin + demo couple
if you want them in prod:

```sh
docker cp supabase/seed-admin.sql   <db-container>:/tmp/ && docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" <db-container> psql -U postgres -d postgres -f /tmp/seed-admin.sql
docker cp supabase/seed-partner.sql <db-container>:/tmp/ && docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" <db-container> psql -U postgres -d postgres -f /tmp/seed-partner.sql
```

---

## 7. GitHub repo settings

### 7.1 Variables (Settings → Secrets and variables → Actions → Variables)

| Name | Example |
|---|---|
| `EC2_INSTANCE_ID` | `i-0abc123...` |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::<ACCOUNT_ID>:role/GithubDeployForever` |
| `AWS_REGION` | `us-east-1` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://api.forever.example.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (the anon key from keygen — public, OK as a variable) |
| `BASE_PATH` | *(leave empty unless serving under a sub-path)* |

### 7.2 Secrets

No app-specific secrets are required for the map — Leaflet ships from npm and
the tiles come from CartoDB / OpenStreetMap (free, no key).

No AWS keys and no `GITHUB_TOKEN` are needed (OIDC + the auto-provided token cover those).

### 7.3 Workflow permissions

Settings → Actions → General → Workflow permissions → **Read and write**.

### 7.4 GHCR package visibility

After the first successful run, an image appears under the repo's **Packages**. Either:
- Keep it private and `docker login` on EC2 with a `read:packages` PAT (§4), or
- Package → Settings → **Change visibility → Public** (then EC2 needs no login).

---

## 8. First deploy

```sh
git commit --allow-empty -m "ci: trigger first deploy"
git push origin main
```

Watch **Actions → Build & Deploy to EC2**:
1. `build` — builds the Next.js standalone server image, pushes `:latest` + `:<sha>` to GHCR (~1 min cached)
2. `deploy` — assumes the AWS role via OIDC, sends an SSM command to EC2 that runs
   `git pull`, `docker compose pull app`, `docker compose up -d`, `docker image prune -f`

Success when the deploy step prints `Status: Success`. Visit
`https://forever.example.com` — the splash should play and sign-in should load.

---

## 9. Day-2 operations

```sh
# Logs (on EC2)
cd /opt/forever
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app
docker compose ps

# Roll back to a previous image (no rebuild): re-tag latest to an old sha and restart
docker pull ghcr.io/<repo>:<old-sha>
docker tag  ghcr.io/<repo>:<old-sha> ghcr.io/<repo>:latest
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d app

# DB backup
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" <db-container> \
  pg_dump -U postgres postgres | gzip > backup-$(date +%F).sql.gz

# Shell on the box without SSH
aws ssm start-session --target <INSTANCE_ID> --region <REGION>
```

Inspect a deploy command from CI history:
```sh
aws ssm get-command-invocation --command-id <id> --instance-id <INSTANCE_ID> --region <REGION>
```

---

## 10. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| GHA `configure-aws-credentials` fails | OIDC trust `sub` doesn't match `repo:<org>/<repo>:ref:refs/heads/main`, or provider thumbprint missing. Re-check §3d. |
| EC2 `docker pull` 401/403 | Not logged in to GHCR, or package is private. `docker login ghcr.io` (§4) or make it public (§7.4). |
| Caddy can't get a cert | DNS A-records not pointing at the Elastic IP yet, or 80/443 closed in the SG. Check `docker compose logs caddy`. |
| Realtime WS fails `TenantNotFound` | Tenant not seeded — rerun §6 step 2. |
| Realtime WS fails `signature_error` / admin API `bad_jwt` | `JWT_SECRET` doesn't match `ANON_KEY`/`SERVICE_ROLE_KEY`. Regenerate all three with `keygen.ps1` and recreate `auth rest realtime kong storage`. |
| Sign-in works but browser can't reach API | `NEXT_PUBLIC_SUPABASE_URL` baked at build time is wrong. It must be the public HTTPS host and set as a GitHub **variable** before the build. |
| App container restarts / blank page | The app runs the Next.js server on **:3000** — make sure Caddy proxies `app:3000`. Check `docker compose logs app` for a boot error (missing `.next/standalone` ⇒ rebuild with `output: 'standalone'`). |

---

## 11. Cost (us-east-1, on-demand, approx.)

| | / month |
|---|---|
| t3.medium 24/7 | ~$30 |
| 30 GB gp3 EBS | ~$2.50 |
| Elastic IP (while attached) | $0 |
| Data transfer (light) | ~$1–5 |
| **Total** | **~$35** |

GHCR storage and GitHub Actions minutes are free for a personal/small-org repo.

---

## 12. Security checklist

- [ ] `.env.production` is **never** committed (it's in `.gitignore`)
- [ ] `JWT_SECRET`, `POSTGRES_PASSWORD` are strong and unique (not the demo defaults)
- [ ] `ANON_KEY` / `SERVICE_ROLE_KEY` regenerated to match `JWT_SECRET` (`keygen.ps1`)
- [ ] Port 22 restricted to your IP; everything else behind Caddy on 443
- [ ] SSM used for shell access (auditable) instead of long-lived SSH keys
- [ ] EBS snapshots scheduled (AWS Backup) for the postgres volume
- [ ] Rotate `JWT_SECRET` + keys + DB password periodically; recreate dependent
      containers and re-seed the realtime tenant after any JWT rotation

---

## 13. Pre-deploy gate — run the E2E suite

Before pushing to `main` (or merging a release PR):

```sh
pwsh ./test-e2e.ps1
```

A **green** run is the gate. Failures bucketed by priority are written to
`playwright-report/SUMMARY.md`; any **P0** or **P1** failure blocks the deploy.
See [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md#automated-coverage-playwright)
for the full suite description and runner options.

---

## 14. AI features (Gemini, server-side)

The app calls Gemini directly from its own Next.js Route Handlers under
`app/api/llm/*`. The provider API key lives in the **server** environment
only (no `NEXT_PUBLIC_` prefix) and the browser never sees it.

Wire-up is a single env variable on the EC2 host:

```
# /opt/forever/.env.production
GEMINI_API_KEY=AIzaSy...   # https://aistudio.google.com/apikey
```

Then recreate just the app container:

```bash
docker compose --env-file .env.production up -d --force-recreate app
```

When `GEMINI_API_KEY` is empty, the routes return `503 { error: 'llmUnavailable' }`
and the calling pages show a localized failure toast. Users can still use the
non-AI parts of every feature.

### Routes live today

| Route | Used by | Returns |
|---|---|---|
| `POST /api/llm/soften` | Whisper page — "Soften this" Sparkles button | `{ softened: string }` |
| `POST /api/llm/mission` | Missions page — "Get a mission" button (replaces the old hardcoded MISSION_POOL) | `{ mission: string }` |

Both routes:
- require a Supabase session cookie (return `401` otherwise — gates the quota against anonymous abuse)
- use `gemini-1.5-flash` (free tier: 15 RPM, 1500 RPD — plenty for two users)
- send a locale-aware prompt template and post-process the response to strip preambles / wrapping quotes

### Backlog — modules with viable AI fit, not yet wired

These have prompt sketches and a clean seam in their page file. Pull any
of them forward by adding a new Route Handler under `app/api/llm/<name>/`
with the same auth gate + `generate(prompt)` shape.

| Module | New route | UI seam | Prompt intent |
|---|---|---|---|
| Echo | `/api/llm/echo-narrative` | `echo/page.tsx` list header | "Weave these N memories from the same date into one tender 2-3 sentence narrative." |
| Promises | `/api/llm/promise-refine` | the add-promise form | "Refine a vague promise into a measurable one-cadence commitment." |
| Gratitude | `/api/llm/gratitude-themes` | gratitude/page.tsx weekly card | "Summarize these 7 gratitude entries into 1-2 themes the couple is leaning into." |
| Timeline | `/api/llm/memory-caption` | add-memory form | "Suggest 3 caption options for a memory dated {date} described as: {raw}." |
| Dinner | `/api/llm/dinner-suggest` | dinner/page.tsx add form | "Suggest 3 dinner options the couple hasn't tried, based on their swipe history." |
| Queue | `/api/llm/queue-recommend` | queue/page.tsx empty state | "Recommend 5 movies similar to the couple's watched list, mixing genres they both lean toward." |
| Voices | `/api/llm/voice-transcribe` | voices/page.tsx NoteCard | "Transcribe this 60-second voice note." *(Multimodal — Gemini 1.5 Flash accepts inline-data audio; bigger lift than text-only routes.)* |

Modules **left AI-free on purpose**: mirror, prompt, bucket, capsule (encrypted —
the server cannot see the plaintext, so AI assistance there would be theatre),
vibe, map, constellation, heartbeat, blueprint, truce, canvas. Adding LLM to any
of those would be AI-for-AI's-sake, not user value.
