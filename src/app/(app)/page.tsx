import { format, parseISO } from 'date-fns';
import { eq } from 'drizzle-orm';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { AreaIcon } from '@/components/area-icon';
import { StreakBadge } from '@/components/streak-badge';
import { getRotatingIdentity, getTodayHabits } from '@/lib/habits';
import { APP_TZ, todayISO } from '@/lib/time';
import { db } from '../../../db/client';
import { sleepLogs, moodLogs } from '../../../db/schema';
import { formatInTimeZone } from 'date-fns-tz';
import { HabitRow } from './today/habit-row';
import { QuickLog } from './today/quick-log';
import { LogOut } from 'lucide-react';
import { logout } from './logout-action';

export const dynamic = 'force-dynamic';

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 · Keystone',
  2: 'Phase 2 · Body',
  3: 'Phase 3 · Mind & Connection',
  4: 'Phase 4 · Optimize',
};

export default async function TodayPage() {
  const today = todayISO();
  const [{ habits, phase }, identity] = await Promise.all([
    getTodayHabits(today),
    getRotatingIdentity(today),
  ]);

  const greeting = greetingFor(new Date());

  const grouped = groupByArea(habits);
  const atRisk = habits.filter((h) => h.streak.status === 'missed_once' || h.streak.status === 'broken');
  const waterHabit = habits.find((h) => h.slug === 'water_intake_3L' || h.slug === 'hydrate_morning') ?? null;
  const pagesHabit = habits.find((h) => h.slug === 'pages_read') ?? null;

  // Pull sleep + mood for quick-log defaults.
  const [todaySleep] = await db.select().from(sleepLogs).where(eq(sleepLogs.date, today)).limit(1);
  const [todayMood] = await db.select().from(moodLogs).where(eq(moodLogs.date, today)).limit(1);

  // Sleep quality input only before noon (per PRD).
  const localHour = Number(formatInTimeZone(new Date(), APP_TZ, 'H'));
  const showSleepCard = localHour < 12;

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{greeting}, Arnav.</h1>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(today), 'EEEE · d MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-[10px] tracking-wider uppercase">
            {PHASE_LABELS[phase] ?? `Phase ${phase}`}
          </Badge>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="rounded-lg border border-border bg-surface p-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Identity statement */}
      {identity && (
        <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Today&apos;s identity</p>
          <p className="mt-1 text-sm leading-snug text-foreground">&ldquo;{identity.text}&rdquo;</p>
        </div>
      )}

      {/* At-risk strip */}
      {atRisk.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-streak-missed">
            At risk — recover today
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {atRisk.map((h) => (
              <div
                key={h.id}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-streak-missed/40 bg-surface px-3 py-2 text-xs"
              >
                <AreaIcon area={h.area} className="h-4 w-4 text-streak-missed" />
                <span>{h.name}</span>
                <StreakBadge streak={h.streak} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Habits grouped */}
      <section className="flex flex-col gap-4">
        {habits.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No habits today. Advance the phase in Settings to unlock more.
          </div>
        ) : (
          Object.entries(grouped).map(([area, list]) => (
            <div key={area}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <AreaIcon area={area} className="h-3.5 w-3.5" />
                {areaLabel(area)}
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((h) => (
                  <HabitRow key={h.id} habit={h} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Review entry points */}
      <section className="mt-2 grid grid-cols-2 gap-2 pb-2">
        <a
          href="/review/weekly"
          className="rounded-2xl border border-border bg-surface px-3 py-3 text-xs hover:border-primary/40"
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Weekly</div>
          <div className="text-sm">Sunday review</div>
        </a>
        <a
          href="/review/quarterly"
          className="rounded-2xl border border-border bg-surface px-3 py-3 text-xs hover:border-primary/40"
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quarterly</div>
          <div className="text-sm">Q-review &amp; photos</div>
        </a>
      </section>

      <QuickLog
        waterHabitId={waterHabit?.id ?? null}
        pagesHabitId={pagesHabit?.id ?? null}
        showSleepCard={showSleepCard}
        sleepQualityToday={todaySleep?.quality15 ?? null}
        moodToday={todayMood?.mood15 ?? null}
      />
    </div>
  );
}

function greetingFor(d: Date) {
  const h = Number(formatInTimeZone(d, APP_TZ, 'H'));
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function groupByArea(list: Awaited<ReturnType<typeof getTodayHabits>>['habits']) {
  const order = ['sleep', 'hydration', 'gym', 'food', 'posture', 'work', 'startup', 'spirit', 'social', 'reading', 'looks', 'env', 'screen', 'finance'];
  const groups: Record<string, typeof list> = {};
  for (const h of list) {
    if (!groups[h.area]) groups[h.area] = [];
    groups[h.area].push(h);
  }
  const ordered: Record<string, typeof list> = {};
  for (const a of order) if (groups[a]) ordered[a] = groups[a];
  for (const a of Object.keys(groups)) if (!ordered[a]) ordered[a] = groups[a];
  return ordered;
}

function areaLabel(area: string) {
  return {
    sleep: 'Sleep',
    hydration: 'Hydration',
    gym: 'Body',
    food: 'Food',
    posture: 'Posture',
    work: 'Office',
    startup: 'Startup',
    spirit: 'Spirit',
    social: 'People',
    reading: 'Reading',
    looks: 'Looks',
    env: 'Environment',
    screen: 'Screen',
    finance: 'Money',
  }[area] || area;
}
