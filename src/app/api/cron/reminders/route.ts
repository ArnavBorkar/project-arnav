import { NextResponse } from 'next/server';
import { and, eq, gte } from 'drizzle-orm';
import { formatInTimeZone } from 'date-fns-tz';
import { db } from '../../../../../db/client';
import { appState, habits, dailyLogs, reminderLog } from '../../../../../db/schema';
import { APP_TZ, todayISO } from '@/lib/time';
import { sendToAll } from '@/lib/push';
import { REMINDERS, isInQuietWindow, type ReminderDef } from '@/lib/reminders';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${expected}`) return true;
  // Allow manual triggering via ?secret=...
  const url = new URL(request.url);
  return url.searchParams.get('secret') === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const hhmm = formatInTimeZone(now, APP_TZ, 'HH:mm');
  const dow = Number(formatInTimeZone(now, APP_TZ, 'i')) % 7; // 1-7 (Mon=1); convert: Sun=0
  const dowJs = dow === 7 ? 0 : dow;
  const day = Number(formatInTimeZone(now, APP_TZ, 'd'));
  const today = todayISO();

  const [state] = await db.select().from(appState).limit(1);
  if (!state || !state.notificationsEnabled) {
    return NextResponse.json({ ok: true, skipped: 'notifications_disabled', hhmm });
  }

  const quietStart = state.quietHoursStart ?? '00:30';
  const quietEnd = state.quietHoursEnd ?? '06:55';
  if (isInQuietWindow(hhmm, quietStart, quietEnd)) {
    return NextResponse.json({ ok: true, skipped: 'quiet_hours', hhmm });
  }

  const due = filterDue(REMINDERS, hhmm, dowJs, day);
  if (due.length === 0) {
    return NextResponse.json({ ok: true, fired: 0, hhmm });
  }

  let fired = 0;
  const firedKeys: string[] = [];

  for (const r of due) {
    // dedupe — don't double-fire in the same minute (cron should be 1/min but be safe)
    const recent = await db
      .select()
      .from(reminderLog)
      .where(and(eq(reminderLog.reminderKey, r.key), gte(reminderLog.firedAt, oneMinAgo())))
      .limit(1);
    if (recent.length > 0) continue;

    // skip if habit already logged today
    if (r.habitSlug) {
      const [h] = await db.select().from(habits).where(eq(habits.slug, r.habitSlug)).limit(1);
      if (h) {
        const [log] = await db
          .select()
          .from(dailyLogs)
          .where(and(eq(dailyLogs.habitId, h.id), eq(dailyLogs.date, today)))
          .limit(1);
        if (log) {
          const target = h.targetValue != null ? Number(h.targetValue) : null;
          const done =
            log.completed ||
            (target != null && log.value != null && Number(log.value) >= target);
          if (done) continue;
        }
      }
    }

    await sendToAll({ title: r.title, body: r.body, url: r.url ?? '/', tag: r.key });
    await db.insert(reminderLog).values({ reminderKey: r.key, habitSlug: r.habitSlug ?? null });
    fired++;
    firedKeys.push(r.key);
  }

  return NextResponse.json({ ok: true, fired, firedKeys, hhmm });
}

function oneMinAgo(): Date {
  return new Date(Date.now() - 60_000);
}

function filterDue(list: ReminderDef[], hhmm: string, dow: number, dayOfMonth: number): ReminderDef[] {
  const out: ReminderDef[] = [];
  for (const r of list) {
    if (r.guardSunday && dow !== 0) continue;
    if (r.guardMonthDayOne && dayOfMonth !== 1) continue;
    if (r.dayOfWeek != null && r.dayOfWeek !== dow) continue;

    if (r.everyMinutes && r.windowStart && r.windowEnd) {
      if (hhmm < r.windowStart || hhmm >= r.windowEnd) continue;
      const [hStart, mStart] = r.windowStart.split(':').map(Number);
      const [h, m] = hhmm.split(':').map(Number);
      const minsSinceWindow = (h - hStart) * 60 + (m - mStart);
      if (minsSinceWindow >= 0 && minsSinceWindow % r.everyMinutes === 0) {
        out.push(r);
      }
      continue;
    }

    if (r.timeHHmm === hhmm) out.push(r);
  }
  return out;
}
