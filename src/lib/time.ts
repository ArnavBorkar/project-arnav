/**
 * All "today" logic runs in the user's configured timezone (default IST).
 * The DB stores dates as YYYY-MM-DD strings keyed off this timezone.
 */
import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const APP_TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';

export function nowInAppTz(): Date {
  return toZonedTime(new Date(), APP_TZ);
}

/** YYYY-MM-DD in the app's timezone. */
export function todayISO(): string {
  return formatInTimeZone(new Date(), APP_TZ, 'yyyy-MM-dd');
}

export function isoForDate(d: Date): string {
  return formatInTimeZone(d, APP_TZ, 'yyyy-MM-dd');
}

/** 0=Sun, 1=Mon ... 6=Sat in the app's timezone. */
export function appWeekday(d: Date = new Date()): number {
  const local = toZonedTime(d, APP_TZ);
  return local.getDay();
}

/** Returns date strings for the last N days, oldest first, ending on today. */
export function lastNDates(n: number): string[] {
  const out: string[] = [];
  const today = nowInAppTz();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(isoForDate(d));
  }
  return out;
}

/** Monday of the week containing the given date, as YYYY-MM-DD. */
export function mondayOf(dateISO: string): string {
  const d = parseISO(dateISO);
  const day = d.getDay(); // 0=Sun
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return format(d, 'yyyy-MM-dd');
}

/** Quarter-starting date (Jan/Apr/Jul/Oct 1st) for the given date. */
export function quarterStartOf(dateISO: string): string {
  const d = parseISO(dateISO);
  const month = d.getMonth();
  const qMonth = Math.floor(month / 3) * 3;
  return format(new Date(d.getFullYear(), qMonth, 1), 'yyyy-MM-dd');
}

/** True if hh:mm (local app TZ) falls inside the inclusive [start, end] window crossing midnight. */
export function isInQuietHours(start: string, end: string, now = new Date()): boolean {
  const local = formatInTimeZone(now, APP_TZ, 'HH:mm');
  // start..end may cross midnight (e.g., 00:30..06:55 — no cross; 22:00..06:00 — cross).
  if (start <= end) return local >= start && local <= end;
  return local >= start || local <= end;
}
