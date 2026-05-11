import 'server-only';
import { and, gte, lte, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import {
  sleepLogs,
  gymSessions,
  dailyLogs,
  habits,
  readingSessions,
  screenTimeLogs,
} from '../../db/schema';
import { mondayOf } from './time';

export interface WeeklyStats {
  weekStart: string; // Monday YYYY-MM-DD
  avgSleepHours: number | null;
  gymSessions: number;
  avgWaterL: number | null;
  pagesRead: number;
  avgIgMinutes: number | null;
  hardStopHits: number;
  hardStopMissed: number;
  familyCalls: number;
}

async function avg(rows: Array<{ value: number | null }>): Promise<number | null> {
  const vals = rows.map((r) => r.value).filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export async function getWeeklyStats(weekStart: string): Promise<WeeklyStats> {
  const start = weekStart;
  const end = endOfWeek(weekStart);

  // sleep duration
  const sleeps = await db
    .select()
    .from(sleepLogs)
    .where(and(gte(sleepLogs.date, start), lte(sleepLogs.date, end)));
  const avgSleepMinutes = await avg(sleeps.map((s) => ({ value: s.durationMinutes })));
  const avgSleepHours = avgSleepMinutes != null ? avgSleepMinutes / 60 : null;

  const sessions = await db
    .select({ c: sql<number>`count(*)` })
    .from(gymSessions)
    .where(and(gte(gymSessions.date, start), lte(gymSessions.date, end)));
  const gymCount = Number(sessions[0]?.c ?? 0);

  const waterRow = (
    await db.select().from(habits).where(eq(habits.slug, 'water_intake_3L')).limit(1)
  )[0];
  let avgWaterL: number | null = null;
  if (waterRow) {
    const w = await db
      .select({ avg: sql<number>`coalesce(avg(${dailyLogs.value}), 0)` })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.habitId, waterRow.id),
          gte(dailyLogs.date, start),
          lte(dailyLogs.date, end)
        )
      );
    const v = Number(w[0]?.avg ?? 0);
    avgWaterL = v > 0 ? v : null;
  }

  const pagesRows = await db
    .select({ s: sql<number>`coalesce(sum(${readingSessions.pagesRead}), 0)` })
    .from(readingSessions)
    .where(and(gte(readingSessions.date, start), lte(readingSessions.date, end)));
  const pagesRead = Number(pagesRows[0]?.s ?? 0);

  const screen = await db
    .select()
    .from(screenTimeLogs)
    .where(and(gte(screenTimeLogs.date, start), lte(screenTimeLogs.date, end)));
  const avgIgMinutes = await avg(screen.map((s) => ({ value: s.instagramMinutes })));

  // hard stop 11:30 PM
  const hardStop = (await db.select().from(habits).where(eq(habits.slug, 'hard_stop_1130pm')).limit(1))[0];
  let hardStopHits = 0;
  let hardStopMissed = 0;
  if (hardStop) {
    const rows = await db
      .select()
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.habitId, hardStop.id),
          gte(dailyLogs.date, start),
          lte(dailyLogs.date, end)
        )
      );
    hardStopHits = rows.filter((r) => r.completed).length;
    hardStopMissed = 7 - hardStopHits;
  }

  // parents_call OR family_call_week
  const parentsCall = (await db.select().from(habits).where(eq(habits.slug, 'parents_call')).limit(1))[0];
  let familyCalls = 0;
  if (parentsCall) {
    const rows = await db
      .select({ c: sql<number>`count(*)` })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.habitId, parentsCall.id),
          eq(dailyLogs.completed, true),
          gte(dailyLogs.date, start),
          lte(dailyLogs.date, end)
        )
      );
    familyCalls = Number(rows[0]?.c ?? 0);
  }

  return {
    weekStart,
    avgSleepHours,
    gymSessions: gymCount,
    avgWaterL,
    pagesRead,
    avgIgMinutes,
    hardStopHits,
    hardStopMissed,
    familyCalls,
  };
}

function endOfWeek(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function priorWeekOf(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export { mondayOf };
