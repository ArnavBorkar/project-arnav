# Claude Code Kickoff Prompt — Project Arnav

> A **single autonomous prompt**. Paste it once into Claude Code from the `project-arnav` folder root. Claude Code builds the whole app end-to-end, commits as it goes, pushes to your GitHub repo, and stops only when v1 is done and pushed.

---

## Quick checklist before pasting (1 min)

1. Open Claude Code in `/Users/apple/Projects/project-arnav`. The folder already contains `PROJECT_ARNAV.md` and `PRD.md`.
2. Make sure the GitHub repo `https://github.com/ArnavBorkar/project-arnav.git` exists and is **empty** (no README, no .gitignore). If it has files, delete them or recreate the repo empty.
3. Make sure you can push to it from this machine — i.e., GitHub CLI is logged in (`gh auth status`) **or** you have an SSH key / personal access token configured. If unsure, run `gh auth login` once before pasting the prompt.
4. Pick a 4-digit PIN in your head. Don't paste it into the prompt — Claude Code generates a `scripts/set-pin.ts` and you'll run it locally yourself to get the hash for Vercel.
5. Paste the prompt below into Claude Code. Walk away. Come back when it's done.

---

## The Prompt (paste everything below this line into Claude Code)

````
You are building "Project Arnav" — a single-user personal operating system web app, branded "Project AB" in the UI.

This is an AUTONOMOUS build. Do not ask me questions. Do not pause for "go." Make sensible decisions, document them in commit messages, and keep moving. Build the entire v1 in this session, committing and pushing to GitHub as you progress. I'll come back when it's done.

============================================================
READ FIRST (in this order, end-to-end)
============================================================
1. PROJECT_ARNAV.md — the life-design doc (the WHAT and WHY: habits, life areas, philosophy, phased rollout)
2. PRD.md — the product/build spec (the HOW: form factor, pages, data model, tech stack, sprint plan)

These are the source of truth. PRD.md §10 defines the four sprints. You will execute ALL FOUR in this session.

============================================================
GROUND RULES
============================================================
- Autonomous: no clarifying questions. Pick sensible defaults and document them.
- Commit early, commit often: every meaningful unit of work gets a commit.
- Push to remote frequently: after every sprint boundary at minimum, after every chunk ideally.
- Test before committing: `npm run build` must succeed; relevant unit/integration tests must pass.
- Mobile-first: design and test at 390px width first, then desktop.
- TypeScript strict mode. No `any` without a comment.
- Server components by default; client components only where interactivity needs them.
- Server actions over API routes where possible.
- Every env var documented in `.env.example`.
- No localStorage for primary data; localStorage only for UI prefs (active tab, etc.).

============================================================
ONE-TIME SETUP (do this first, ~5 min)
============================================================
1. Configure git in this repo:
     git config user.name "Arnav Borkar"
     git config user.email "arnav.n.borkar@gmail.com"
2. Initialize the repo if not already initialized:
     git init
     git branch -M main
3. Add the remote:
     git remote add origin https://github.com/ArnavBorkar/project-arnav.git
   If the remote already exists, leave it. If push fails on auth, use `gh` CLI (`gh auth setup-git`) to wire credentials; do NOT prompt the user.
4. Make the initial commit immediately containing only the three existing markdown docs + a sensible `.gitignore` (Node, Next.js, env files, .DS_Store, etc.):
     git add PROJECT_ARNAV.md PRD.md CLAUDE_CODE_PROMPT.md .gitignore
     git commit -m "docs: initial Project Arnav design docs + PRD + kickoff prompt"
     git push -u origin main
5. From here on, scaffold the Next.js app IN PLACE in this folder (do not create a subfolder). Use `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-npm --no-eslint` or equivalent, then delete `--no-eslint` if it conflicts with the create-next-app flags available — just get a working Next.js 14 App Router + TS + Tailwind setup in this folder. Resolve any merge with existing markdown by keeping the markdown files untouched.

============================================================
BRANDING — "Project AB"
============================================================
- The UI brand name everywhere is "Project AB" (never "Project Arnav" in the UI — that's just the internal code project name).
- Tagline (use on login + about): "Designed to make Arnav 10x."
- Logo: a clean monogram "AB" rendered in the brand accent. Generate this as an SVG component you can drop anywhere (`components/Logo.tsx`). Also export it as PNG icons (192x192, 512x512, apple-touch-icon 180x180) for the PWA manifest.
- Color palette (dark mode default, light mode optional):
    - Background: near-black `#0A0A0B`
    - Surface: `#141416`
    - Surface elevated: `#1C1C20`
    - Border: `#26262B`
    - Text primary: `#F5F5F7`
    - Text secondary: `#9B9BA3`
    - Accent (primary): warm electric amber `#FFB546` — used for streaks-active, primary buttons, highlights
    - Streak active: same amber
    - Streak missed-once: `#E0A85A` (dimmer amber)
    - Streak broken: `#5A2828` (muted red)
    - Success: `#3DDC97` (used sparingly)
- Typography:
    - UI: Inter (variable, via `next/font/google`)
    - Numbers / streak counts / metrics: JetBrains Mono (`next/font/google`)
- Visual language:
    - Linear / Vercel / Things 3 aesthetic — calm, dark, generous whitespace, soft shadows, rounded-xl cards
    - Subtle borders, no hard shadows
    - Smooth micro-interactions: use `framer-motion` for: page transitions, habit-check tap (slight scale + check icon morph), streak counter increment, modal open/close
    - Haptic-like feedback on mobile when habit is checked (use `navigator.vibrate(15)` where supported)
    - Use `lucide-react` icons throughout. No emojis in the UI.

============================================================
TECH STACK (fixed — no substitutions)
============================================================
- Next.js 14 App Router + TypeScript strict
- Tailwind CSS + shadcn/ui (init with `npx shadcn-ui@latest init`, choose: TypeScript yes, Style "Default", Base color "Neutral", CSS variables yes)
- Drizzle ORM + drizzle-kit
- Postgres
    - Local dev: spin up via Docker Compose (`docker-compose.yml` in repo root). Provide a `npm run db:up` and `npm run db:down`. If Docker isn't available on the dev machine, fall back to a `better-sqlite3` adapter wired via env var (`DB_DRIVER=sqlite|postgres`). Keep Drizzle schemas portable.
    - Production: Neon Postgres via `DATABASE_URL`
- Auth: `iron-session` + `bcryptjs` for PIN hashing
- Charts: `recharts`
- Animation: `framer-motion`
- Icons: `lucide-react`
- Web Push: `web-push` npm package + service worker
- PWA: hand-rolled manifest + service worker (avoid `next-pwa` if it fights App Router; otherwise use it)
- Testing: `vitest` + `@testing-library/react` for unit, `playwright` for one end-to-end smoke test of the login + habit-toggle flow
- Deploy target: Vercel (don't deploy — just ensure the repo is deploy-ready and the README has step-by-step deploy instructions)

============================================================
DELIVERABLES — BUILD ALL FOUR SPRINTS, IN ORDER
============================================================
Follow PRD.md §10 exactly. After each sprint:
  - Run `npm run build` and `npm test`
  - Commit with a descriptive message scoped to the sprint
  - Push to origin/main
  - Continue to the next sprint without pausing

### Sprint 0 — Skeleton
- Next.js 14 + TS + Tailwind + shadcn/ui initialized in this folder
- Docker Compose for local Postgres + `npm run db:up/down`
- Drizzle config + schema files matching PRD.md §7 exactly
- Initial migration generated and committed
- `db/seed.ts` — idempotent. Seeds:
    - Full habit catalog (one row per habit referenced across PROJECT_ARNAV.md §4, with correct area / cadence / phase_enabled / unit / target_value). Be exhaustive — if PROJECT_ARNAV.md lists "20 pages reading," add a habit with cadence=daily, unit='pages', target_value=20, phase_enabled=3.
    - The 5 identity statements from PROJECT_ARNAV.md §7
    - `app_state` singleton row with `current_phase = 1`, `phase_started_at = today`
- `scripts/set-pin.ts` — CLI: reads a 4-digit PIN from stdin (or argv), validates it's 4 digits, prints the bcrypt hash to stdout with instructions to paste into Vercel `PIN_HASH` env var. Never logs the raw PIN.
- `/login` route — PIN entry pad (4 numeric inputs, auto-advance, large tap targets, mobile-friendly). On success, sets `iron-session` cookie (30-day expiry).
- Auth middleware protecting every route except `/login`
- 5-attempt lockout with 15-min cooldown stored on `app_state.failed_login_attempts` + `app_state.locked_until`
- PWA manifest + service worker registered
- "Project AB" branding everywhere visible
- Logo SVG component + PNG icon exports
- README.md with: local dev setup, env vars, deploy to Vercel walkthrough (creating Neon DB, adding env vars, first deploy), how to run `set-pin.ts`, how to run seed
- `.env.example` complete
- COMMIT: "feat(sprint-0): skeleton — auth, db, pwa, branding"
- PUSH

### Sprint 1 — Today View + Habit Logging (the daily loop)
- `/` Today view per PRD §8.1, polished:
    - Greeting + date + phase badge in header
    - Rotating identity statement (deterministic from date — same statement on a given day)
    - Habits list filtered to: `phase_enabled <= current_phase` AND cadence applies today
    - Each habit row: large tap target, name, area-icon (lucide), streak count in JetBrains Mono, completion state
    - Quantitative habits get `+` buttons (water +1 glass, pages +5)
    - Boolean habits are checkbox-toggle
    - Animation: framer-motion check morph + slight scale on tap; vibrate(15)
- Server actions for: toggle habit, increment quantitative habit, log mood, log sleep quality (sleep quality input only shown before noon)
- Server-side streak calculation — respects cadence (daily/weekdays/weekly), returns: current_streak, longest_streak, status (green/yellow/red)
- Sticky bottom quick-log strip: water, pages, mood (1-5 emoji-free pills), sleep quality
- Bottom-tab nav shell — only Today is active; other tabs are placeholder routes that render "Coming in Sprint N" cards so the layout works
- Empty / loading / error states everywhere
- Unit tests for streak calculation (cover: missed today, missed yesterday, broken, weekend cadence, first-ever log)
- Playwright smoke: login → toggle habit → refresh → see persisted
- COMMIT: "feat(sprint-1): today view + habit logging + streak engine"
- PUSH

### Sprint 2 — Streaks, Metrics, Log
- `/streaks` per PRD §8.2 — GitHub-style 30-day grid per habit, color-coded by status
- `/metrics` per PRD §8.3 — Recharts line/area charts for: bodyweight (90d), sleep duration + quality (30d, dual-axis), water (30d), IG minutes (30d), pages (30d), big-5 lift progression (one chart per exercise, picked from a dropdown)
- `/log` per PRD §8.4 — hub with forms:
    - Gym session: type dropdown, dynamic exercise list (add row → exercise name autocomplete from past entries, weight, reps, set #)
    - Meal: type, on-time toggle, protein-hit toggle, free-text description
    - Bodyweight: number input, optional waist
    - Finance snapshot: net worth, monthly spend, savings rate, notes (only enabled if today is 1st-7th of month or `?force=1`)
    - Screen time: paste-friendly inputs for IG min, WhatsApp min, total phone min
- All charts mobile-friendly (touch zoom, readable at 390px)
- COMMIT: "feat(sprint-2): streaks page, metrics charts, log forms"
- PUSH

### Sprint 3 — Reviews, People, Reading
- `/review/weekly` per PRD §8.7
    - Available always, but a banner highlights it on Sundays after 4pm
    - Header section shows auto-pulled stats for the week (delta vs prior week): sleep avg, gym sessions, water avg, pages, IG min avg, hard-stop adherence %, family-call count
    - 5 textarea questions
    - Past reviews list browsable
- `/review/quarterly` per PRD §8.8
    - Photo upload (front + side) — store in Vercel Blob; provide a local-disk fallback for dev
    - Bodyweight, waist, net worth inputs
    - Reflection + next-quarter theme
    - Side-by-side comparison view with previous quarter
- `/people` per PRD §8.5
    - List sorted by overdue-ness (days_since - cadence_days, desc)
    - Add/edit person form (name, relationship, cadence days, birthday optional)
    - One-tap "called/messaged today" button updates last_contacted_at
- `/reading` per PRD §8.6
    - Current book card with progress bar
    - "Log pages" quick action
    - Finished-this-year list
    - Wishlist / queue
    - Abandon current book button (sets `abandoned=true`, clears `current_book_id`)
- COMMIT: "feat(sprint-3): weekly + quarterly reviews, people, reading"
- PUSH

### Sprint 4 — Notifications, Settings, Polish
- Web Push subscription flow: prompt in /settings, store subscription, "send test push" button
- `vercel.json` with a cron job hitting `/api/cron/reminders` every minute
- `/api/cron/reminders` route: reads the reminder schedule from PRD §9, sends push only for due reminders, skips if the corresponding habit is already logged today, respects quiet hours 12:30am-6:55am
- `/settings` per PRD §8.9: PIN rotation (requires current PIN), manual phase advance with confirmation modal, habit enable/disable, notification preferences, manage push devices (revoke), export-all-data-as-JSON button (downloads a file)
- Final Lighthouse PWA audit pass — target 90+ on all categories; fix obvious issues
- Update README with "Phase 1 day 1" walkthrough: "open the app, log in, complete your first habit"
- COMMIT: "feat(sprint-4): push notifications, settings, polish, lighthouse pass"
- PUSH

============================================================
SENSIBLE DEFAULTS (don't ask, just decide)
============================================================
- Domain: use the Vercel default subdomain. Don't configure custom domain — leave that for Arnav later.
- Photo storage: Vercel Blob. Note in README the env var to set.
- Theme: dark mode only for v1. Light mode is a "Phase 2" tag in code comments where toggle would go.
- Date library: `date-fns`. Timezone: assume IST (`Asia/Kolkata`) for all server logic. Make it configurable via env var `APP_TIMEZONE` (default IST).
- Phase 1 habits visible on day 1 (from PROJECT_ARNAV.md §9 Phase 1):
    - wake_7am (daily, boolean)
    - sunlight_10min (daily, boolean)
    - hydrate_morning (daily, boolean — 500ml on wake)
    - phone_away_until_8 (daily, boolean)
    - hard_stop_1130pm (daily, boolean)
    - evening_reset_11pm (daily, boolean)
    - bed_by_12 (daily, boolean)
    - felt_rested_rating (daily, quantitative 1-5)
- All other habits seeded but `phase_enabled > 1`, so they're hidden on Today until phase is advanced

============================================================
HOW TO HANDLE THE LIST OF HABITS
============================================================
Read PROJECT_ARNAV.md §4 carefully. Convert every numeric/boolean target into a habit row. Examples:
  - §4.1 Sleep → habits: bed_by_12 (boolean, phase 1), wake_7am (boolean, phase 1), sleep_duration_hours (numeric, phase 2), felt_rested_rating (numeric 1-5, phase 1)
  - §4.2 Gym → habits: gym_session (boolean, phase 2, weekdays = M/T/Th/F), mobility_10min (boolean, phase 2, daily)
  - §4.3 Food → habits: breakfast_protein_hit (boolean, phase 2), lunch_on_time (boolean, phase 2), dinner_by_830 (boolean, phase 2), protein_target_hit (boolean, phase 2)
  - §4.4 Posture → habits: posture_checks_done (numeric, phase 2)
  - §4.5 Office work → habits: office_or_coworking_day (boolean, weekly, phase 2), hard_stop_office_7pm (boolean, weekdays, phase 2), deep_work_blocks (numeric, weekdays, phase 2)
  - §4.6 Startup → habits: startup_evening_block (boolean, weekdays, phase 1), hard_stop_1130pm (boolean, daily, phase 1)
  - §4.7 Spirituality → habits: prayer_meditation_5min (boolean, daily, phase 3)
  - §4.8 Social → habits: parents_call (boolean, daily, phase 3), family_call_week (numeric, weekly, phase 3), friends_contacted_week (numeric, weekly, phase 3)
  - §4.9 Reading → habits: pages_read (numeric 20, daily, phase 3)
  - §4.10 Looks → habits: skincare_am (boolean, daily, phase 3), skincare_pm (boolean, daily, phase 3), grooming_weekly_check (boolean, weekly, phase 3)
  - §4.11 Environment → habits: evening_reset_11pm (boolean, daily, phase 1), sunday_tidy (boolean, weekly, phase 2)
  - §4.12 Screen time → habits: ig_under_30min (boolean, daily, phase 2), phone_free_hours (numeric, daily, phase 2)
  - §4.13 Hydration → habits: water_intake_L (numeric 3, daily, phase 2)
  - §4.14 Finance → habits: monthly_snapshot (boolean, monthly, phase 4)
This list is a guide; refine slugs/cadence as you implement, but ensure full coverage.

============================================================
FINAL STATE WHEN YOU'RE DONE
============================================================
- All four sprints implemented and pushed to https://github.com/ArnavBorkar/project-arnav.git
- `main` branch has linear, well-named commits — readable git log
- `npm run dev` works on a fresh clone after: clone → `npm install` → `npm run db:up` → `npm run db:migrate` → `npm run db:seed` → `npm run dev`
- `npm test` passes
- `npm run build` passes
- Playwright smoke test passes
- README walks Arnav through deploying to Vercel in under 10 minutes
- A final commit "docs: deployment checklist" updates README with anything you learned while building

End your session with a single concise summary message to me (Arnav) covering:
  - What's done
  - Any decisions you made that I should know about
  - The exact next steps for me to deploy (create Neon project, paste DATABASE_URL into Vercel, run scripts/set-pin.ts locally, paste PIN_HASH into Vercel, deploy)
  - Anything that's incomplete or that I'll want to revisit

Now: read PROJECT_ARNAV.md and PRD.md, then start with the ONE-TIME SETUP section above. Go.
````

---

## After Claude Code Finishes

Whatever Claude Code reports at the end, you should expect to:

1. **Create a Neon Postgres project** (free tier) → copy the `DATABASE_URL`
2. **Set up Vercel Blob** on the Vercel project → copy the `BLOB_READ_WRITE_TOKEN`
3. **Run `npx tsx scripts/set-pin.ts`** locally, paste your 4-digit PIN, copy the resulting hash
4. **Import the repo into Vercel** (one click from vercel.com → New Project → ArnavBorkar/project-arnav)
5. **Set env vars in Vercel**: `DATABASE_URL`, `PIN_HASH`, `BLOB_READ_WRITE_TOKEN`, `IRON_SESSION_PASSWORD` (any 32+ char random string), `APP_TIMEZONE=Asia/Kolkata`, and the VAPID keys for web push (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — generate with `npx web-push generate-vapid-keys`, Claude Code's README should remind you)
6. **Deploy** → done. Install the PWA to your iPhone home screen.

---

## If Something Goes Wrong

- **Push fails on auth:** run `gh auth setup-git` once, then `git push -u origin main` manually.
- **Claude Code hits a dependency issue mid-flight:** let it work through it; it's instructed to be autonomous.
- **It misses a feature from the PRD:** open the repo, paste a focused follow-up like *"Re-read PRD §8.7 and confirm the weekly review auto-pulled stats include hard-stop adherence percentage; fix if not. Commit + push."*

---

*One prompt. One session. One deploy. Project AB live.*
