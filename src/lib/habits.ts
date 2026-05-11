import 'server-only';
import { and, eq, gte, lte, inArray, asc, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  appState,
  habits,
  dailyLogs,
  identityStatements,
} from '../../db/schema';
import { cadenceCountsOn, calculateStreak, type Cadence, type StreakResult, type LogEntry } from './streaks';
import { todayISO, lastNDates } from './time';

export type HabitArea =
  | 'sleep'
  | 'gym'
  | 'food'
  | 'posture'
  | 'work'
  | 'startup'
  | 'spirit'
  | 'social'
  | 'reading'
  | 'looks'
  | 'env'
  | 'screen'
  | 'hydration'
  | 'finance';

export interface HabitWithStatus {
  id: number;
  slug: string;
  name: string;
  area: HabitArea;
  cadence: Cadence;
  targetValue: number | null;
  unit: string | null;
  phaseEnabled: number;
  displayOrder: number | null;
  description: string | null;
  // today-state
  completedToday: boolean;
  valueToday: number | null;
  // streak
  streak: StreakResult;
}

export async function getAppState() {
  const rows = await db.select().from(appState).limit(1);
  if (rows.length === 0) {
    const today = todayISO();
    await db.insert(appState).values({ id: 1, currentPhase: 1, phaseStartedAt: today });
    return (await db.select().from(appState).limit(1))[0];
  }
  return rows[0];
}

export async function getRotatingIdentity(dateISO: string) {
  const rows = await db
    .select()
    .from(identityStatements)
    .where(eq(identityStatements.active, true));
  if (rows.length === 0) return null;
  const sorted = rows.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  // deterministic by date
  const dayNum = Math.floor(new Date(dateISO + 'T00:00:00Z').getTime() / 86_400_000);
  return sorted[dayNum % sorted.length];
}

/**
 * Returns all habits visible today (cadence applies + phase unlocked + not archived),
 * each enriched with today's log state and streak metrics.
 */
export async function getTodayHabits(today = todayISO()): Promise<{
  phase: number;
  habits: HabitWithStatus[];
}> {
  const state = await getAppState();
  const phase = state.currentPhase ?? 1;

  const allHabits = await db
    .select()
    .from(habits)
    .where(and(eq(habits.archived, false), lte(habits.phaseEnabled, phase)))
    .orderBy(asc(habits.displayOrder));

  const visible = allHabits.filter((h) => cadenceCountsOn(h.cadence as Cadence, today));
  if (visible.length === 0) return { phase, habits: [] };

  const habitIds = visible.map((h) => h.id);

  // logs for streak (last 60 days) + today
  const since = lastNDates(60)[0];
  const allLogs = await db
    .select()
    .from(dailyLogs)
    .where(and(inArray(dailyLogs.habitId, habitIds), gte(dailyLogs.date, since)));

  const byHabit = new Map<number, LogEntry[]>();
  for (const h of visible) byHabit.set(h.id, []);
  for (const l of allLogs) {
    const arr = byHabit.get(l.habitId!) ?? [];
    arr.push({ date: String(l.date), completed: !!l.completed, value: l.value != null ? Number(l.value) : null });
    byHabit.set(l.habitId!, arr);
  }

  const enriched: HabitWithStatus[] = visible.map((h) => {
    const logs = byHabit.get(h.id) ?? [];
    const todayLog = logs.find((l) => l.date === today);
    const streak = calculateStreak({
      cadence: h.cadence as Cadence,
      target: h.targetValue != null ? Number(h.targetValue) : null,
      logs,
      today,
    });
    return {
      id: h.id,
      slug: h.slug,
      name: h.name,
      area: h.area as HabitArea,
      cadence: h.cadence as Cadence,
      targetValue: h.targetValue != null ? Number(h.targetValue) : null,
      unit: h.unit,
      phaseEnabled: h.phaseEnabled,
      displayOrder: h.displayOrder,
      description: h.description,
      completedToday: todayLog?.completed ?? false,
      valueToday: todayLog?.value ?? null,
      streak,
    };
  });

  return { phase, habits: enriched };
}

/**
 * Upserts a daily_logs row: boolean toggle (true/false).
 */
export async function toggleHabitLog(habitId: number, dateISO: string, completed: boolean) {
  const existing = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.habitId, habitId), eq(dailyLogs.date, dateISO)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(dailyLogs)
      .set({ completed, loggedAt: new Date() as unknown as Date })
      .where(eq(dailyLogs.id, existing[0].id));
    return;
  }
  await db.insert(dailyLogs).values({
    habitId,
    date: dateISO,
    completed,
  });
}

/**
 * Increment a quantitative habit's value by `delta`. Marks completed when
 * the value crosses the target.
 */
export async function incrementHabitLog(habitId: number, dateISO: string, delta: number) {
  const habit = (await db.select().from(habits).where(eq(habits.id, habitId)).limit(1))[0];
  if (!habit) throw new Error('Habit not found');
  const target = habit.targetValue != null ? Number(habit.targetValue) : null;

  const existing = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.habitId, habitId), eq(dailyLogs.date, dateISO)))
    .limit(1);

  if (existing.length === 0) {
    const value = Math.max(0, delta);
    await db.insert(dailyLogs).values({
      habitId,
      date: dateISO,
      value: value as unknown as string,
      completed: target != null ? value >= target : false,
    });
    return;
  }

  const current = existing[0].value != null ? Number(existing[0].value) : 0;
  const next = Math.max(0, current + delta);
  await db
    .update(dailyLogs)
    .set({
      value: next as unknown as string,
      completed: target != null ? next >= target : !!existing[0].completed,
      loggedAt: new Date() as unknown as Date,
    })
    .where(eq(dailyLogs.id, existing[0].id));
}

/** Habits flagged "at risk" — missed yesterday but recoverable today. */
export async function getAtRiskHabits(today = todayISO()) {
  const { habits: list } = await getTodayHabits(today);
  return list.filter((h) => h.streak.status === 'missed_once' || h.streak.status === 'broken');
}

/** Count logs for an arbitrary habit slug in a date window. */
export async function countLogsBetween(slug: string, startISO: string, endISO: string) {
  const habit = (await db.select().from(habits).where(eq(habits.slug, slug)).limit(1))[0];
  if (!habit) return 0;
  const rows = await db
    .select()
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.habitId, habit.id),
        gte(dailyLogs.date, startISO),
        lte(dailyLogs.date, endISO),
        eq(dailyLogs.completed, true)
      )
    );
  return rows.length;
}

/** Sum of quantitative values for a habit slug in a window. */
export async function sumValueBetween(slug: string, startISO: string, endISO: string) {
  const habit = (await db.select().from(habits).where(eq(habits.slug, slug)).limit(1))[0];
  if (!habit) return 0;
  const rows = await db
    .select({ s: sql<number>`coalesce(sum(${dailyLogs.value}), 0)` })
    .from(dailyLogs)
    .where(
      and(eq(dailyLogs.habitId, habit.id), gte(dailyLogs.date, startISO), lte(dailyLogs.date, endISO))
    );
  return Number(rows[0]?.s ?? 0);
}
