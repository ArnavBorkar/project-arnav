# Project AB

> A single-user personal operating system. **Designed to make Arnav 10x.**

Built from [PROJECT_ARNAV.md](./PROJECT_ARNAV.md) (the *what* and *why*) and [PRD.md](./PRD.md) (the *how*).

---

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS + custom shadcn-style primitives
- Drizzle ORM — Postgres in prod (Neon), SQLite fallback for dev
- `iron-session` + `bcryptjs` for 4-digit PIN auth
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
# .env already contains DB_DRIVER=sqlite — works out of the box

# Option B — Postgres in Docker
npm run db:up                 # starts postgres on localhost:5432
# edit .env: comment out DB_DRIVER=sqlite, ensure DATABASE_URL is set

# 3) migrate + seed
npm run db:migrate
npm run db:seed

# 4) set your PIN
npm run set-pin               # enter a 4-digit PIN; copies the hash
# paste the printed PIN_HASH=... into .env

# 5) generate a session secret (≥32 chars)
openssl rand -base64 48
# paste into .env as SESSION_SECRET=...

# 6) run
npm run dev                   # http://localhost:3000
```

### Phase 1 — day 1 walkthrough
1. `npm run dev`, open http://localhost:3000.
2. Enter your PIN on the lock screen.
3. The Today view shows your Phase 1 habits — wake 7, sunlight, hydrate, phone away till 8, evening reset, hard stop 11:30, bed by 12, plus the daily felt-rested rating.
4. Tap a habit to mark it done. Streak counts begin from the first tap.
5. Use the bottom-right `+` to log a quick water glass, pages, mood, or sleep quality.
6. Phase 2 unlocks via Settings → Advance Phase, but per PROJECT_ARNAV.md §9 don't unlock it for 14 days. Habits beyond Phase 1 stay hidden until then.

---

## Deploy to Vercel (≈10 minutes)

1. **Create a Neon project** at https://neon.tech. Copy the pooled connection string — it looks like `postgres://USER:PASS@HOST/db?sslmode=require`.
2. **Push this repo** to GitHub (already linked to https://github.com/ArnavBorkar/project-arnav).
3. **Import to Vercel**: New Project → Import Git Repo → pick `project-arnav` → "Deploy".
4. **Set environment variables** in Vercel (Settings → Environment Variables):

   | Key | Value | Notes |
   |-----|-------|-------|
   | `DATABASE_URL` | the Neon URL from step 1 | required |
   | `SESSION_SECRET` | `openssl rand -base64 48` output (≥32 chars) | required |
   | `PIN_HASH` | output of `npm run set-pin` locally | required |
   | `APP_TIMEZONE` | `Asia/Kolkata` | optional |
   | `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | once deployed |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | run `npm run vapid:generate` and paste both | required for push |
   | `CRON_SECRET` | any random string; Vercel passes it as auth on the cron | required |
   | `BLOB_READ_WRITE_TOKEN` | from Vercel Storage → Blob | required for quarterly photo upload |

5. **Run migrations on Neon**:
   ```bash
   # locally, pointed at the production DATABASE_URL
   DATABASE_URL='your-neon-url' npm run db:migrate
   DATABASE_URL='your-neon-url' npm run db:seed
   ```
6. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy) after env vars are set.
7. **Open the app**. Enter your PIN. Install to home screen on iPhone (Share → Add to Home Screen) for push notifications.

The Vercel cron schedule lives in `vercel.json` — it fires `/api/cron/reminders` every minute. It self-throttles via quiet-hours and "already-logged" checks.

---

## Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm test` | Run vitest unit tests |
| `npm run test:e2e` | Playwright smoke test |
| `npm run db:up` / `db:down` | Start / stop local Postgres in Docker |
| `npm run db:migrate` | Apply migrations to active DB |
| `npm run db:seed` | Idempotent seed (habits, identity statements, app_state) |
| `npm run db:generate` | Regenerate Drizzle migration after schema changes |
| `npm run db:studio` | Drizzle Studio (DB explorer) |
| `npm run set-pin` | Generate bcrypt hash for a 4-digit PIN |
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
  api/               API routes (auth, push, cron)
src/components/      shared UI primitives + app shell
src/lib/             auth, session, time, streaks, utils
tests/               vitest unit tests
e2e/                 playwright smoke
```

---

## Source-of-truth references

- `PROJECT_ARNAV.md` — life-design doc (philosophy, habits, phased rollout)
- `PRD.md` — product spec (pages, data model, tech, sprints)
- Both are versioned in git. If a habit is added or dropped, update [db/seed.ts](./db/seed.ts).
