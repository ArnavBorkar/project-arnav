import { and, gte, inArray, asc, eq, lte } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { habits as habitsTable, dailyLogs } from '../../../../db/schema';
import { getAppState } from '@/lib/habits';
import { todayISO, lastNDates } from '@/lib/time';
import { calculateStreak, cadenceCountsOn, type Cadence } from '@/lib/streaks';
import { AreaIcon } from '@/components/area-icon';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type DayCell = { date: string; counted: boolean; status: 'done' | 'missed' | 'pending' | 'na' };

export default async function StreaksPage() {
  const today = todayISO();
  const state = await getAppState();
  const phase = state.currentPhase ?? 1;

  const all = await db
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.archived, false), lte(habitsTable.phaseEnabled, phase)))
    .orderBy(asc(habitsTable.displayOrder));

  const ids = all.map((h) => h.id);
  const since = lastNDates(60)[0];
  const logs = ids.length
    ? await db
        .select()
        .from(dailyLogs)
        .where(and(inArray(dailyLogs.habitId, ids), gte(dailyLogs.date, since)))
    : [];

  const last30 = lastNDates(30);

  type Row = {
    habit: typeof all[number];
    cells: DayCell[];
    current: number;
    longest: number;
  };
  const rows: Row[] = all.map((h) => {
    const habitLogs = logs.filter((l) => l.habitId === h.id);
    const byDate = new Map<string, { completed: boolean; value: number | null }>();
    for (const l of habitLogs) {
      byDate.set(String(l.date), {
        completed: !!l.completed,
        value: l.value != null ? Number(l.value) : null,
      });
    }
    const target = h.targetValue != null ? Number(h.targetValue) : null;

    const cells: DayCell[] = last30.map((date) => {
      const counted = cadenceCountsOn(h.cadence as Cadence, date);
      if (!counted) return { date, counted: false, status: 'na' };
      const entry = byDate.get(date);
      let satisfied = false;
      if (entry) {
        satisfied = entry.completed || (target != null && entry.value != null && entry.value >= target);
      }
      if (date === today && !satisfied) return { date, counted: true, status: 'pending' };
      return { date, counted: true, status: satisfied ? 'done' : 'missed' };
    });

    const streakLogs = habitLogs.map((l) => ({
      date: String(l.date),
      completed: !!l.completed,
      value: l.value != null ? Number(l.value) : null,
    }));
    const r = calculateStreak({ cadence: h.cadence as Cadence, target, logs: streakLogs, today });

    return { habit: h, cells, current: r.current, longest: r.longest };
  });

  // group rows by phase_enabled ascending
  const byPhase = new Map<number, Row[]>();
  for (const r of rows) {
    const arr = byPhase.get(r.habit.phaseEnabled) ?? [];
    arr.push(r);
    byPhase.set(r.habit.phaseEnabled, arr);
  }

  const phases = [...byPhase.keys()].sort();

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Streaks</h1>
        <p className="text-xs text-muted-foreground">Last 30 days. Tap any habit for context.</p>
      </header>

      {phases.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          No habits unlocked yet.
        </div>
      )}

      {phases.map((p) => (
        <section key={p} className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Phase {p}
          </h2>
          <div className="flex flex-col gap-2">
            {(byPhase.get(p) ?? []).map(({ habit, cells, current, longest }) => (
              <div
                key={habit.id}
                className="rounded-2xl border border-border bg-surface px-3 py-3"
              >
                <div className="flex items-center gap-2">
                  <AreaIcon area={habit.area} className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">{habit.name}</span>
                  <div className="ml-auto flex items-center gap-3 font-mono text-xs">
                    <span className="text-primary">{current}</span>
                    <span className="text-muted-foreground">best {longest}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-[3px] overflow-x-auto">
                  {cells.map((c) => (
                    <div
                      key={c.date}
                      title={`${c.date} — ${c.status}`}
                      className={cn(
                        'h-7 w-[10px] shrink-0 rounded-sm',
                        c.status === 'done' && 'bg-primary',
                        c.status === 'missed' && 'bg-streak-broken/70',
                        c.status === 'pending' && 'border border-dashed border-primary/60 bg-transparent',
                        c.status === 'na' && 'bg-surface-elevated'
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
