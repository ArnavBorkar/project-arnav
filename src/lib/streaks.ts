/**
 * Streak engine.
 *
 * Inputs:
 *  - habit cadence (daily / weekdays / weekly / monthly / custom)
 *  - habit target_value (for quantitative habits)
 *  - history of (date, completed, value) entries
 *
 * Definitions:
 *  - A day "counts" if the cadence triggers on that date.
 *  - A counting day is "satisfied" if completed=true OR value>=target.
 *  - current_streak: number of consecutive most-recent counting days, all satisfied,
 *      ending at the most recent counting day that is on-or-before today.
 *      If TODAY is a counting day but not yet satisfied, we still extend the streak
 *      using yesterday (or the previous counting day) — i.e. you haven't lost it
 *      just because the day isn't over.
 *  - status:
 *      'active'  → streak >= 1
 *      'missed_once' → the previous counting day was missed but the one before was hit
 *                      (one chance left — two-day rule)
 *      'broken'  → previous two counting days were both missed
 *      'inactive' → no log history yet
 */
import { parseISO, addDays, isAfter, isEqual } from 'date-fns';
import { isoForDate } from './time';

export type Cadence = 'daily' | 'weekdays' | 'weekly' | 'custom' | 'monthly';
export type StreakStatus = 'active' | 'missed_once' | 'broken' | 'inactive';

export interface LogEntry {
  date: string; // YYYY-MM-DD
  completed: boolean;
  value: number | null;
}

export interface StreakInput {
  cadence: Cadence;
  target?: number | null;
  logs: LogEntry[];
  today: string; // YYYY-MM-DD, app TZ
  /** Anchor weekday (0=Sun) for weekly habits. Defaults to Sun. */
  weeklyAnchor?: number;
}

export interface StreakResult {
  current: number;
  longest: number;
  status: StreakStatus;
}

export function cadenceCountsOn(cadence: Cadence, dateISO: string): boolean {
  const d = parseISO(dateISO);
  const dow = d.getDay();
  switch (cadence) {
    case 'daily':
      return true;
    case 'weekdays':
      return dow >= 1 && dow <= 5;
    case 'weekly':
      return true; // weekly habits count once per week; aggregation handles that
    case 'monthly':
      return d.getDate() === 1;
    case 'custom':
      return false;
    default:
      return true;
  }
}

function satisfied(entry: LogEntry | undefined, target: number | null | undefined): boolean {
  if (!entry) return false;
  if (entry.completed) return true;
  if (target != null && entry.value != null && entry.value >= target) return true;
  return false;
}

/** Returns the counting dates (YYYY-MM-DD) ending at `today` (inclusive), oldest first.
 *  Caps at maxDays of *calendar* days back.
 */
function countingDates(cadence: Cadence, today: string, maxDays = 365): string[] {
  const out: string[] = [];
  const start = parseISO(today);
  for (let i = 0; i < maxDays; i++) {
    const d = addDays(start, -i);
    const iso = isoForDate(d);
    if (cadenceCountsOn(cadence, iso)) out.push(iso);
  }
  return out.reverse();
}

/** Returns the start-of-week (ISO Mon) for each week appearing in the log, plus this week. */
function weeklyBuckets(today: string, weeks = 52): { weekKey: string; days: string[] }[] {
  const result: { weekKey: string; days: string[] }[] = [];
  const startToday = parseISO(today);
  for (let w = 0; w < weeks; w++) {
    const anchor = addDays(startToday, -7 * w);
    // Monday of that week
    const dow = anchor.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = addDays(anchor, mondayOffset);
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      // skip days strictly after today
      if (!isAfter(d, startToday)) {
        days.push(isoForDate(d));
      }
    }
    result.push({ weekKey: isoForDate(monday), days });
  }
  return result.reverse();
}

export function calculateStreak(input: StreakInput): StreakResult {
  const { cadence, target, logs, today } = input;
  if (logs.length === 0) return { current: 0, longest: 0, status: 'inactive' };

  const byDate = new Map<string, LogEntry>();
  for (const l of logs) byDate.set(l.date, l);

  if (cadence === 'weekly') {
    // Weekly: a week is "satisfied" if any log in the week meets the bar.
    const buckets = weeklyBuckets(today, 104);
    // For quantitative weekly habits, sum value across the week.
    const weekHits: boolean[] = buckets.map(({ days }) => {
      let anyComplete = false;
      let sum = 0;
      for (const d of days) {
        const e = byDate.get(d);
        if (!e) continue;
        if (e.completed) anyComplete = true;
        if (e.value != null) sum += Number(e.value);
      }
      if (target != null) return sum >= target;
      return anyComplete;
    });

    // current week (last bucket): allow not-yet-complete to NOT break the streak
    const len = weekHits.length;
    const isCurrentWeekDone = weekHits[len - 1];
    let current = 0;
    let longest = 0;
    let run = 0;
    for (const hit of weekHits) {
      if (hit) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }
    // current streak = run ending at the most recent week
    // if current week is not yet done, we still count the streak from last week back
    let idx = len - 1;
    if (!isCurrentWeekDone) idx = len - 2;
    let c = 0;
    for (let i = idx; i >= 0; i--) {
      if (weekHits[i]) c++;
      else break;
    }
    current = c + (isCurrentWeekDone ? 1 : 0);
    // wait — we double-counted. recompute cleanly:
    current = 0;
    if (isCurrentWeekDone) {
      for (let i = len - 1; i >= 0; i--) {
        if (weekHits[i]) current++;
        else break;
      }
    } else {
      for (let i = len - 2; i >= 0; i--) {
        if (weekHits[i]) current++;
        else break;
      }
    }
    longest = Math.max(longest, current);

    const status = deriveStatus(weekHits, len, isCurrentWeekDone);
    return { current, longest, status };
  }

  // daily / weekdays / monthly: per-day rollup
  const dates = countingDates(cadence, today, 365);
  if (dates.length === 0) return { current: 0, longest: 0, status: 'inactive' };

  const dayHits: boolean[] = dates.map((iso) => satisfied(byDate.get(iso), target));
  const isTodayCounting = cadenceCountsOn(cadence, today);
  // If today is counting and equals the last date in `dates`:
  const todayInList = isEqual(parseISO(dates[dates.length - 1]), parseISO(today));
  const isCurrentDayDone = isTodayCounting && todayInList ? dayHits[dayHits.length - 1] : false;

  let longest = 0;
  let run = 0;
  for (const h of dayHits) {
    if (h) {
      run++;
      if (run > longest) longest = run;
    } else run = 0;
  }

  let current = 0;
  if (isCurrentDayDone) {
    for (let i = dayHits.length - 1; i >= 0; i--) {
      if (dayHits[i]) current++;
      else break;
    }
  } else if (isTodayCounting && todayInList) {
    // today is counting but not yet done — extend "potential" streak from yesterday
    for (let i = dayHits.length - 2; i >= 0; i--) {
      if (dayHits[i]) current++;
      else break;
    }
  } else {
    for (let i = dayHits.length - 1; i >= 0; i--) {
      if (dayHits[i]) current++;
      else break;
    }
  }

  longest = Math.max(longest, current);
  const status = deriveStatus(dayHits, dayHits.length, isCurrentDayDone);
  return { current, longest, status };
}

function deriveStatus(hits: boolean[], len: number, isCurrentDone: boolean): StreakStatus {
  if (hits.every((h) => !h)) return 'inactive';
  if (isCurrentDone) return 'active';
  // current period not yet done — look at previous one (or two)
  const prev = len >= 2 ? hits[len - 2] : false;
  const prev2 = len >= 3 ? hits[len - 3] : false;
  if (prev) return 'active'; // not done today, but yesterday hit
  // prev missed
  if (prev2) return 'missed_once';
  return 'broken';
}
