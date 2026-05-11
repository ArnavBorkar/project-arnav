# Project Arnav — Product Requirements Document (PRD)

> Build spec for the Project Arnav web app. Pairs with `PROJECT_ARNAV.md` (which defines the *what* and the *why*). This doc defines *how* to build it.

**Audience:** Claude Code (and any future engineer touching this).
**Owner:** Arnav Borkar
**Version:** v1 — 2026-05-11

---

## 1. Product Overview

Project Arnav is a **single-user personal operating system** — a web app that tracks habits, metrics, reviews, and reminders across every area of life defined in `PROJECT_ARNAV.md` (sleep, gym, food, posture, work, startup, spirituality, family, reading, looks, environment, screen time, hydration, finance).

It is **always-on**: hosted on a public URL, accessible from any browser, installable as a PWA on iPhone + Mac. It fires reminders even when the app isn't open. It is the daily interface for Project Arnav.

---

## 2. Goals & Non-Goals

### Goals (v1)
- Single source of truth for daily habits, metrics, and reviews
- Same experience on iPhone Safari (installed as PWA) and Mac browser
- Background reminders via Web Push (works when the app is closed)
- Simple PIN-based auth (single user, low friction)
- Data persistence in a real database — survives device wipes and is synced across devices
- Phased rollout support — only show habits for the currently active phase
- Streak tracking, weekly review flow, quarterly review flow
- Take <5 min/day to update

### Non-Goals (v1, deliberately)
- Multi-user, sharing, social features
- Mobile native apps (PWA is enough)
- ML/AI insights — keep it deterministic and dumb at first
- Apple Health / Whoop / Oura integration (Phase 2 feature)
- Public "build in public" share pages
- Dark mode toggle (default to a single themed look; can add later)

---

## 3. Users

Exactly one: **Arnav Borkar** (`arnav@e6x.io`). Auth is a 4-digit PIN. There is no signup screen, no email reset flow. The PIN is set once via an env variable at deploy time and can be rotated by re-deploying.

---

## 4. Form Factor & Access

- **Type:** Responsive web app, installable as PWA
- **Hosting:** Public URL (e.g., `arnav.life` or a Vercel subdomain — Arnav to decide later)
- **Devices:**
  - iPhone Safari (installed to home screen as PWA — gets push notifications, icon, splash screen)
  - macOS Safari/Chrome/Arc (installed via "Install app" or just bookmarked)
- **Offline behavior:** Read-only when offline. Writes queue and sync when reconnected (nice-to-have for v1; acceptable to fail gracefully).
- **Layout:** Mobile-first. Desktop is mobile-layout with more whitespace and a wider content column. No separate desktop UI.

---

## 5. Authentication

### Requirements
- 4-digit PIN entered on first visit
- PIN is hashed (bcrypt or argon2) — never stored in plaintext
- Session lasts 30 days via signed HTTP-only cookie (e.g., `iron-session`)
- "Sign out" button clears the cookie
- 5 wrong PIN attempts → 15-minute lockout (rate-limit by IP + cookie)

### Setup
- `PIN_HASH` is an environment variable set at deploy time
- A small CLI script (`scripts/set-pin.ts`) generates the hash so Arnav can rotate the PIN without writing code

### Pages requiring auth
- All pages except `/login`

---

## 6. Information Architecture (Pages)

Mobile-first nav: bottom tab bar on mobile, left rail on desktop.

| Route | Purpose |
|-------|---------|
| `/login` | PIN entry |
| `/` (Today) | Daily checklist, streaks-at-a-glance, quick logs |
| `/streaks` | Full streak grid (GitHub-style) per habit |
| `/metrics` | All numeric trends: weight, sleep, water, IG minutes, lifts, reading pages |
| `/log` | Manual entry hub — gym sessions, meals, weight, finance snapshot |
| `/people` | Family/friend contact cadence — who to call next, longest silence |
| `/reading` | Current book, pages today, list, finished books |
| `/review/weekly` | Sunday weekly review (5 questions + auto stats) |
| `/review/quarterly` | Photo upload, weight/waist, net worth, 90-day reflection |
| `/settings` | PIN rotation, phase advance, habit enable/disable, notification settings, data export |

---

## 7. Data Model

Use Postgres. Schema below is the intended shape — let Drizzle ORM types drive it.

### Core tables

```sql
-- Single-user, so most tables don't need a user_id column.

-- App-level state
app_state (
  id INT PRIMARY KEY DEFAULT 1, -- singleton row
  current_phase INT NOT NULL DEFAULT 1, -- 1..4 per PROJECT_ARNAV.md §9
  phase_started_at DATE NOT NULL,
  current_book_id INT REFERENCES books(id),
  pin_hash TEXT NOT NULL,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ
);

-- Habit catalog
habits (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- 'wake_7am', 'gym', 'hydration_3L', etc.
  name TEXT NOT NULL,
  area TEXT NOT NULL, -- 'sleep' | 'gym' | 'food' | 'posture' | 'work' | 'startup' | 'spirit' | 'social' | 'reading' | 'looks' | 'env' | 'screen' | 'hydration' | 'finance'
  cadence TEXT NOT NULL, -- 'daily' | 'weekdays' | 'weekly' | 'custom'
  target_value NUMERIC, -- e.g., 3 for "3L water", 20 for "20 pages"
  unit TEXT, -- 'glasses', 'pages', 'minutes', 'sessions', NULL for boolean
  phase_enabled INT NOT NULL DEFAULT 1, -- earliest phase this habit becomes active
  archived BOOLEAN DEFAULT FALSE,
  display_order INT
);

-- Daily completion log (the heart of the app)
daily_logs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  habit_id INT REFERENCES habits(id),
  completed BOOLEAN DEFAULT FALSE,
  value NUMERIC, -- for quantitative habits (e.g., 2.5 L water)
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, habit_id)
);

-- Sleep
sleep_logs (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL, -- date you woke up
  bedtime TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  duration_minutes INT,
  quality_1_5 INT, -- felt rested rating
  notes TEXT
);

-- Gym
gym_sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT, -- 'push' | 'pull' | 'legs' | 'upper' | 'cardio' | 'custom'
  notes TEXT,
  duration_minutes INT
);
exercise_sets (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES gym_sessions(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  weight_kg NUMERIC,
  reps INT,
  set_number INT,
  rpe NUMERIC -- optional
);

-- Body metrics
body_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  notes TEXT
);

-- Meals
meals (
  id SERIAL PRIMARY KEY,
  datetime TIMESTAMPTZ NOT NULL,
  type TEXT, -- 'breakfast' | 'lunch' | 'snack' | 'dinner'
  on_time BOOLEAN,
  protein_hit BOOLEAN,
  description TEXT
);

-- Social / people
people (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  relationship TEXT, -- 'parent' | 'sibling' | 'grandparent' | 'family' | 'friend'
  cadence_days INT NOT NULL, -- 1 = daily-ish, 7 = weekly, 14 = bi-weekly
  last_contacted_at DATE,
  birthday DATE,
  notes TEXT
);

-- Reading
books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT, -- 'business' | 'technical' | 'fiction' | 'spiritual' | 'biography'
  total_pages INT,
  current_page INT DEFAULT 0,
  started_at DATE,
  finished_at DATE,
  abandoned BOOLEAN DEFAULT FALSE
);
reading_sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  book_id INT REFERENCES books(id),
  pages_read INT NOT NULL
);

-- Finance (monthly snapshots only)
finance_snapshots (
  id SERIAL PRIMARY KEY,
  month DATE NOT NULL, -- first of the month
  net_worth NUMERIC,
  monthly_spend NUMERIC,
  savings_rate NUMERIC,
  notes TEXT
);

-- Weekly review
weekly_reviews (
  id SERIAL PRIMARY KEY,
  week_starting DATE UNIQUE NOT NULL, -- Monday of the reviewed week
  q1_worked TEXT,
  q2_didnt_work TEXT,
  q3_streak_at_risk TEXT,
  q4_ship_target TEXT,
  q5_call_overdue TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quarterly review
quarterly_reviews (
  id SERIAL PRIMARY KEY,
  quarter_starting DATE UNIQUE NOT NULL,
  photo_url TEXT,
  weight_kg NUMERIC,
  waist_cm NUMERIC,
  net_worth NUMERIC,
  reflection TEXT,
  next_quarter_theme TEXT
);

-- Identity statements
identity_statements (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  display_order INT
);

-- Push notification subscriptions (one per device)
push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_label TEXT, -- 'iPhone', 'MacBook', set by user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screen time (manually logged from iOS Screen Time or guess)
screen_time_logs (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  instagram_minutes INT,
  whatsapp_minutes INT,
  total_phone_minutes INT
);
```

### Seeding
On first deploy, seed:
- The 5 identity statements from `PROJECT_ARNAV.md` §7
- The full habit catalog (one row per habit referenced in §4 of PROJECT_ARNAV.md), each with `phase_enabled` set per §9's phased rollout
- `app_state` singleton with `current_phase = 1`, `phase_started_at = NOW()`

A seed file at `db/seed.ts` does this idempotently.

---

## 8. Feature Detail

### 8.1 Today View (`/`)

- **Header strip:**
  - Greeting + date
  - One rotating identity statement (rotates daily — uses date as seed)
  - Current phase badge (e.g., "Phase 1: Keystone")
- **Today's checklist:** All habits where `phase_enabled <= current_phase` and `cadence` triggers today (daily, weekdays on M-F, etc.). Each row:
  - Checkbox or `+` button (for quantitative habits)
  - Habit name + area icon
  - Streak count next to it
  - Tap to log; long-press for notes
- **Quick log strip (sticky bottom):**
  - Water +1 glass
  - Pages +5
  - Mood 1-5
  - Sleep quality (only visible in morning, before noon)
- **Bottom: "What's at risk"** — habits with broken/yellow streaks this week, surfaced first

### 8.2 Streaks View (`/streaks`)

- Grid view, one row per habit
- Last 30 days as colored squares (green = done, yellow = missed once, red = broken)
- Tap a square to inspect that day's log entry
- Visual hierarchy: phase-1 habits at top, then phase-2, etc.

### 8.3 Metrics View (`/metrics`)

- Line charts (Recharts or Chart.js):
  - Bodyweight (90d)
  - Sleep duration + quality (30d, dual-axis)
  - Water L/day (30d)
  - IG minutes/day (30d)
  - Pages/day (30d)
  - Big-5 lifts progression (per exercise: bench/OHP/squat/dead/row)
- Each chart tappable for full-screen view

### 8.4 Log View (`/log`)

- Hub with cards:
  - "Log gym session" → form: type, exercises with sets/reps/weight
  - "Log meal" → form: type, on-time?, protein hit?, description
  - "Log bodyweight"
  - "Log finance snapshot" (only available 1st of month)
  - "Log screen time" (paste from iOS Screen Time)

### 8.5 People View (`/people`)

- List of all people, sorted by "days since last contacted - cadence_days" descending (most overdue first)
- Each row: name, relationship, last contacted date, "X days overdue" or "✓ on track"
- Tap a row → mark "Called/messaged today" → updates `last_contacted_at`
- Add person form

### 8.6 Reading View (`/reading`)

- Current book + progress bar
- Today's pages logged
- "Log pages read" button
- Finished books list (this year)
- Wishlist / queue
- Abandon button on current book (guilt-free)

### 8.7 Weekly Review (`/review/weekly`)

- Available Sunday after 4 PM (or anytime if user explicitly opens it)
- Auto-shows last week's stats side-by-side:
  - Sleep avg, gym sessions, water avg, pages read, IG min avg, hard-stop adherence, family calls
- Below stats: 5 question form (textareas)
- Submit → save to `weekly_reviews`, mark as complete
- Past reviews browsable

### 8.8 Quarterly Review (`/review/quarterly`)

- Available on the first Sunday of every quarter (Jan, Apr, Jul, Oct) or manually
- Photo upload (front + side) — stored in object storage (Vercel Blob, S3, or Supabase Storage)
- Bodyweight, waist, net worth inputs
- Reflection textarea
- Next-quarter theme input
- Compare-with-last-quarter view (side-by-side photos + metric deltas)

### 8.9 Settings (`/settings`)

- Rotate PIN (requires current PIN)
- Manually advance phase (with confirmation)
- Habit catalog: enable / disable / archive individual habits
- Notification preferences: which reminders to fire, quiet hours
- Manage push devices (revoke a device)
- Export all data as JSON (downloads a file)
- Re-trigger DB seed (dev only)

---

## 9. Reminders & Notifications

The app sends reminders via **Web Push** (works on installed iOS PWA from iOS 16.4+ and on macOS Safari/Chrome).

### Reminder schedule (default — all configurable in Settings)

| Time | Reminder |
|------|----------|
| 7:00 AM | "Wake up — sunlight, water, no phone" |
| 8:00 AM | "Phone allowed now" (positive cue) |
| 12:55 PM | "Lunch in 5 — real meal, away from desk" |
| Every 45 min, 10am-6pm | "Posture check — stand, walk 2 min" |
| 4:30 PM | "Snack — protein in" |
| 7:00 PM | "Hard stop office work" |
| 8:00 PM | "Dinner window closing at 8:30" |
| 11:00 PM | "Evening reset — 5 min" |
| 11:30 PM | "**Hard stop startup work** — save state, lights out in 30" |
| 11:45 PM | "No screens. Kindle or sleep." |
| Sunday 5:00 PM | "Weekly review time" |
| 1st of month | "Finance snapshot — 15 min" |

### Implementation
- `web-push` npm package on the server
- Vercel Cron (or Supabase/Cloudflare Cron — pick one based on hosting) fires every minute and checks for due reminders
- Reminders skip if the user already logged that habit (e.g., don't fire "log water" if 3L is already in)
- Quiet hours: 12:30 AM – 6:55 AM (no push fires in this window)

### Local in-app reminders
- Top banner on Today view if anything is overdue ("Lunch is 30 min late")

---

## 10. MVP Scope (What to Ship First)

### Sprint 0 — Skeleton (build first, 1-2 days)
- Next.js 14 app with App Router
- Tailwind + shadcn/ui setup
- Postgres connection (Neon) + Drizzle migration system
- `/login` PIN page + session cookie
- Seed script with habits + identity statements
- Deploy to Vercel; PWA manifest + service worker basics
- Confirm install-to-home-screen works on iPhone

### Sprint 1 — Today View + Habit Logging (the daily loop)
- `/` Today view fully functional
- Habit completion (boolean + quantitative)
- Streak calculation (server-side)
- Quick logs (water, pages, mood, sleep quality)
- Bottom-tab navigation shell

### Sprint 2 — Metrics + Streaks
- `/streaks` page
- `/metrics` page with charts
- `/log` page (gym, meals, weight, finance)

### Sprint 3 — Reviews + People + Reading
- Weekly review flow
- Quarterly review flow
- People page
- Reading page

### Sprint 4 — Notifications + Polish
- Web Push subscription flow
- Server cron for scheduled reminders
- Settings page (PIN rotation, phase advance, exports)
- Performance pass + Lighthouse PWA audit

**Phase 1 of PROJECT_ARNAV.md only needs Sprint 0 + Sprint 1 done.** Don't block Phase 1 launch on the full app being ready.

---

## 11. Tech Stack (Recommended)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | SSR, server actions, cron, Vercel deploy in one |
| Lang | TypeScript (strict) | Single-dev project — types prevent foot-guns |
| UI | Tailwind CSS + shadcn/ui | Fast, mobile-first, easy to customize |
| Charts | Recharts | Already familiar from artifacts |
| ORM | Drizzle | Type-safe, lightweight, easy migrations |
| DB | Postgres on Neon | Generous free tier, serverless, branchable |
| Auth | iron-session + bcrypt | Simple, no external service |
| Push | `web-push` + service worker | Native browser API, works on iOS PWA |
| Cron | Vercel Cron | Free on Hobby tier, integrated |
| Storage (photos) | Vercel Blob | Integrated, simple |
| Hosting | Vercel | Free, fast, integrates with everything above |
| PWA | next-pwa or hand-rolled manifest | Either works |

**If Arnav prefers different stack:** the only hard requirements are Postgres-compatible DB, public URL, ability to run scheduled jobs, and Web Push support. Everything else is swappable.

---

## 12. Non-Functional Requirements

- **Performance:** Mobile First Contentful Paint < 1.5s on 4G; Today view interactive in < 2s
- **Accessibility:** WCAG AA where reasonable — color contrast, keyboard nav, screen-reader labels on icons
- **Privacy:** Single user, no analytics, no third-party trackers. All data lives in the user's Neon DB.
- **Data portability:** "Export to JSON" in Settings dumps every row
- **Resilience:** If the cron skips a reminder, that's tolerable. If a habit log fails to save, that's a P0 bug.
- **Cost ceiling:** Must run on free tiers — Vercel Hobby + Neon Free + Vercel Blob free → ~$0/month at this scale

---

## 13. Visual Design Direction

Not a full design system, but:
- **Vibe:** clean, monochrome-ish with one accent color. Think Linear, not Notion.
- **Typography:** Inter (sans) for UI; JetBrains Mono for numbers/streaks
- **Cards:** subtle borders, generous padding, rounded-xl
- **Color semantics:**
  - Green = streak active
  - Yellow = missed yesterday (recoverable)
  - Red = broken streak
  - Neutral = inactive / not yet phased in
- **No emojis in production UI** (but icons from `lucide-react` are fine and encouraged)

---

## 14. Open Questions for Arnav

- **Domain?** `arnav.life`? Subdomain of an existing domain? Or just `project-arnav.vercel.app` for now?
- **PIN itself:** Set at deploy time via env var. Pick a 4-digit number now, set it later via `scripts/set-pin.ts`.
- **Photo storage:** Vercel Blob (~5GB free) or Supabase Storage (1GB free) — Vercel Blob is simpler if hosting on Vercel.
- **Sleep tracker integration:** Want to wire Apple Health later? If yes, add a Phase 2 ticket for "Health Auto-Import" via Shortcuts.
- **Mood tracking depth:** Just 1-5 emoji scale, or add a free-text "what's on your mind"? Default: 1-5 only for v1.

---

## 15. Source-of-Truth Reference

- **The "what" and "why"** lives in `PROJECT_ARNAV.md` — life areas, habits, philosophy, weekly template, phased rollout, anti-patterns
- **The "how to build it"** lives in this PRD
- **Both are versioned in Git.** If PROJECT_ARNAV.md changes (e.g., a habit is dropped or added), the seed file and habit catalog should be updated accordingly. PRs should reference which doc they implement.

---

*v1 — 2026-05-11. Update alongside PROJECT_ARNAV.md.*
