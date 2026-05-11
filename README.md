# Project AB

> A single-user personal operating system. **Designed to make Arnav 10x.**

Built from [PROJECT_ARNAV.md](./PROJECT_ARNAV.md) (the *what* and *why*) and [PRD.md](./PRD.md) (the *how*).

---

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS + custom shadcn-style primitives
- Drizzle ORM — Postgres in prod (Neon), SQLite fallback for dev
- `iron-session` + `bcryptjs` for 4-digit PIN auth (5-attempt / 15-min lockout)
- Web Push (VAPID) + Vercel Cron for reminders
- Recharts for metrics, framer-motion for micro-interactions, lucide-react for icons
- Vitest unit tests, Playwright smoke E2E
- PWA — installable on iPhone Safari (iOS 16.4+) and macOS Safari/Chrome/Arc

---

## Local dev (fresh clone)

```bash
# 1) install deps
npm install

# 2) pick a database
# Option A — SQLite (zero-config; recommended for trying it out)
cp .env.example .env
# .env defaults to SQLite — works out of the box

# Option B — Postgres in Docker
npm run db:up                 # starts postgres on localhost:5432
# edit .env: set DB_DRIVER=postgres (or remove DB_DRIVER), keep DATABASE_URL

# 3) generate a session secret (≥32 chars) and put it in .env as SESSION_SECRET
openssl rand -base64 48

# 4) migrate + seed
npm run db:migrate
npm run db:seed

# 5) set your PIN (writes hash to the DB locally — sidesteps .env $-expansion)
npm run set-pin -- 1234       # or omit the arg to be prompted

# 6) run
npm run dev                   # http://localhost:3000
```

### Phase 1 — day 1 walkthrough

1. `npm run dev`, open http://localhost:3000.
2. Enter your PIN on the lock screen.
3. The Today view shows your Phase 1 habits — wake 7, sunlight, hydrate, phone away till 8, startup evening block, evening reset, hard stop 11:30, bed by 12, plus the daily felt-rested rating.
4. Tap a habit to mark it done. Streak counts begin from the first tap.
5. Use the floating `+` (bottom-right) to log a quick water glass, pages, mood, or sleep quality.
6. The bottom Review tiles take you to weekly / quarterly reviews. Weekly review pulls auto-stats vs the prior week; quarterly handles photo uploads + side-by-side comparison.
7. After 14 days of Phase 1, head to **Settings → Phase → Advance to Phase 2** to unlock the body habits (gym, food timing, hydration target, mobility, posture, screen time).

---

## Deploy to Vercel (≈10 minutes)

1. **Create a Neon project** at https://neon.tech. Copy the pooled connection string — it looks like `postgres://USER:PASS@HOST/db?sslmode=require`.
2. **Push this repo** to GitHub (already linked to https://github.com/ArnavBorkar/project-arnav).
3. **Import to Vercel**: New Project → Import Git Repo → pick `project-arnav` → "Deploy".
4. **Run migrations + seed** against Neon (locally, pointed at production):
   ```bash
   DATABASE_URL='your-neon-url' DB_DRIVER=postgres npm run db:migrate
   DATABASE_URL='your-neon-url' DB_DRIVER=postgres npm run db:seed
   ```
5. **Set environment variables** in Vercel (Settings → Environment Variables — all environments):

   | Key | Value | Notes |
   |-----|-------|-------|
   | `DATABASE_URL` | the Neon URL from step 1 | required |
   | `SESSION_SECRET` | `openssl rand -base64 48` output (≥32 chars) | required |
   | `PIN_HASH` | output of `npm run set-pin -- 1234 --print-only` locally | required; Vercel handles `$` correctly |
   | `APP_TIMEZONE` | `Asia/Kolkata` | optional, defaults to IST |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | once deployed |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | run `npm run vapid:generate` and paste both | required for push |
   | `VAPID_SUBJECT` | `mailto:arnav@e6x.io` | optional |
   | `CRON_SECRET` | any random string; Vercel passes it as `Authorization: Bearer …` to the cron | required |
   | `BLOB_READ_WRITE_TOKEN` | from Vercel Storage → Blob → "Connect to Project" | required for quarterly photo upload |

6. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy) so the new env vars take effect.
7. **Open the app**. Enter your PIN. On iPhone, Share → Add to Home Screen to install as a PWA — that's the only way to receive push notifications on iOS.
8. In Settings → Notifications, tap **Enable push on this device**, then **Send test push** to verify.

The Vercel cron schedule lives in `vercel.json` — it fires `/api/cron/reminders` every minute and self-throttles via quiet-hours and "already-logged" checks.

---

## Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm test` | Run vitest unit tests |
| `npm run test:e2e` | Playwright smoke test (login → habit toggle → reload) |
| `npm run db:up` / `db:down` | Start / stop local Postgres in Docker |
| `npm run db:migrate` | Apply migrations to active DB |
| `npm run db:seed` | Idempotent seed (habits, identity statements, app_state) |
| `npm run db:generate` | Regenerate Drizzle migration after schema changes |
| `npm run db:studio` | Drizzle Studio (DB explorer) |
| `npm run set-pin` | Generate bcrypt PIN hash; writes to local DB and prints for Vercel |
| `npm run vapid:generate` | Generate a VAPID keypair for Web Push |

---

## Repo layout

```
db/                  drizzle schema, client, migrations, seed
drizzle/pg/          generated postgres migrations
drizzle/sqlite/      generated sqlite migrations (dev fallback)
public/              PWA manifest, service worker, generated icons
scripts/             one-off CLI tools (set-pin, generate-vapid, generate-icons)
src/app/             Next.js App Router routes
  (app)/             authenticated app shell
  login/             PIN entry
  api/               API routes (auth, push, cron, export)
src/components/      shared UI primitives + app shell
src/lib/             auth, session, time, streaks, habits, metrics, reviews, push, storage
tests/               vitest unit tests (streak engine)
e2e/                 playwright smoke
```

---

## Source-of-truth references

- `PROJECT_ARNAV.md` — life-design doc (philosophy, habits, phased rollout)
- `PRD.md` — product spec (pages, data model, tech, sprints)
- Both are versioned in git. If a habit is added or dropped, update [db/seed.ts](./db/seed.ts) — it's idempotent.

---

## Deployment checklist

Hand this off to future-you when deploying. Tick each box.

- [ ] Neon project created, copied the **pooled** connection string
- [ ] `DATABASE_URL='…' DB_DRIVER=postgres npm run db:migrate` ran clean
- [ ] `DATABASE_URL='…' DB_DRIVER=postgres npm run db:seed` ran clean
- [ ] `npm run set-pin -- --print-only` produced a fresh bcrypt hash
- [ ] Vercel env vars set: `DATABASE_URL`, `SESSION_SECRET`, `PIN_HASH`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `BLOB_READ_WRITE_TOKEN`
- [ ] `vercel.json` cron showed up under Vercel → Crons (every-minute schedule)
- [ ] iPhone: Share → Add to Home Screen worked; PWA installed
- [ ] Settings → Enable push on this device → granted; Send test push received
- [ ] At least one habit toggled and the streak counter rendered correctly

## Things to revisit later

- **Light-mode toggle** — dark mode only in v1 (PRD §13); the brand tokens are set up so adding light mode means defining `:root.light { ... }` in `src/app/globals.css`.
- **Apple Health / Whoop / Oura import** — Phase 2 feature per PRD §2; would replace manual sleep duration entry.
- **Voice journaling** — Today quick-log mentions it as a nice-to-have.
- **Custom domain** — defaults to `*.vercel.app`; switch when ready.
- **Next.js security patch** — current pinned version has an upstream advisory ([nextjs.org/blog/security-update-2025-12-11](https://nextjs.org/blog/security-update-2025-12-11)). Upgrade `next` to 14.2.24+ after smoke-testing.
