import 'server-only';
import { and, asc, eq, gte, sql, inArray, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  bodyMetrics,
  sleepLogs,
  dailyLogs,
  habits,
  screenTimeLogs,
  exerciseSets,
  gymSessions,
  readingSessions,
} from '../../db/schema';
import { lastNDates } from './time';

function densify(
  dates: string[],
  rows: Array<{ date: string; value: number | null }>
): Array<{ date: string; value: number | null }> {
  const map = new Map(rows.map((r) => [r.date, r.value]));
  return dates.map((date) => ({ date, value: map.get(date) ?? null }));
}

export async function getWeightSeries(days = 90) {
  const dates = lastNDates(days);
  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(gte(bodyMetrics.date, dates[0]))
    .orderBy(asc(bodyMetrics.date));
  return densify(
    dates,
    rows.map((r) => ({ date: String(r.date), value: r.weightKg != null ? Number(r.weightKg) : null }))
  );
}

export async function getWaistSeries(days = 90) {
  const dates = lastNDates(days);
  const rows = await db
    .select()
    .from(bodyMetrics)
    .where(gte(bodyMetrics.date, dates[0]))
    .orderBy(asc(bodyMetrics.date));
  return densify(
    dates,
    rows.map((r) => ({ date: String(r.date), value: r.waistCm != null ? Number(r.waistCm) : null }))
  );
}

export async function getSleepSeries(days = 30) {
  const dates = lastNDates(days);
  const rows = await db
    .select()
    .from(sleepLogs)
    .where(gte(sleepLogs.date, dates[0]))
    .orderBy(asc(sleepLogs.date));

  const map = new Map(
    rows.map((r) => [
      String(r.date),
      {
        duration: r.durationMinutes ?? null,
        quality: r.quality15 ?? null,
      },
    ])
  );
  return dates.map((d) => {
    const v = map.get(d);
    return {
      date: d,
      left: v?.duration != null ? Number((v.duration / 60).toFixed(1)) : null,
      right: v?.quality ?? null,
    };
  });
}

/** Sums values for a quantitative habit slug by date. */
export async function getHabitValueSeries(slug: string, days = 30) {
  const dates = lastNDates(days);
  const habit = (await db.select().from(habits).where(eq(habits.slug, slug)).limit(1))[0];
  if (!habit) return dates.map((date) => ({ date, value: null }));
  const rows = await db
    .select({ date: dailyLogs.date, value: dailyLogs.value })
    .from(dailyLogs)
    .where(and(eq(dailyLogs.habitId, habit.id), gte(dailyLogs.date, dates[0])));
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = r.value != null ? Number(r.value) : null;
    if (v != null) map.set(String(r.date), v);
  }
  return dates.map((date) => ({ date, value: map.get(date) ?? null }));
}

export async function getScreenTimeSeries(days = 30) {
  const dates = lastNDates(days);
  const rows = await db
    .select()
    .from(screenTimeLogs)
    .where(gte(screenTimeLogs.date, dates[0]))
    .orderBy(asc(screenTimeLogs.date));
  const map = new Map(rows.map((r) => [String(r.date), r]));
  return dates.map((date) => ({
    date,
    instagram: map.get(date)?.instagramMinutes ?? null,
    whatsapp: map.get(date)?.whatsappMinutes ?? null,
    total: map.get(date)?.totalPhoneMinutes ?? null,
  }));
}

export async function getReadingPagesSeries(days = 30) {
  const dates = lastNDates(days);
  const rows = await db
    .select({ date: readingSessions.date, pages: readingSessions.pagesRead })
    .from(readingSessions)
    .where(gte(readingSessions.date, dates[0]));
  const map = new Map<string, number>();
  for (const r of rows) {
    const cur = map.get(String(r.date)) ?? 0;
    map.set(String(r.date), cur + (r.pages ?? 0));
  }
  return dates.map((date) => ({ date, value: map.get(date) ?? null }));
}

/** Returns max set weight per session for a given exercise. */
export async function getExerciseProgression(exercise: string, days = 180) {
  const dates = lastNDates(days);
  const sessions = await db
    .select()
    .from(gymSessions)
    .where(gte(gymSessions.date, dates[0]))
    .orderBy(asc(gymSessions.date));
  if (sessions.length === 0) return [];
  const sessionIds = sessions.map((s) => s.id);
  const sets = await db
    .select()
    .from(exerciseSets)
    .where(and(inArray(exerciseSets.sessionId, sessionIds), eq(exerciseSets.exercise, exercise)));
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const sess = sessions.find((x) => x.id === s.sessionId);
    if (!sess) continue;
    const date = String(sess.date);
    const w = s.weightKg != null ? Number(s.weightKg) : 0;
    byDate.set(date, Math.max(byDate.get(date) ?? 0, w));
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, value]) => ({ date, value }));
}

export async function listKnownExercises(): Promise<string[]> {
  const rows = await db
    .select({ exercise: exerciseSets.exercise, last: sql<string>`max(${exerciseSets.id})` })
    .from(exerciseSets)
    .groupBy(exerciseSets.exercise)
    .orderBy(desc(sql`max(${exerciseSets.id})`))
    .limit(50);
  return rows.map((r) => r.exercise);
}
