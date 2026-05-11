import { describe, it, expect } from 'vitest';
import { calculateStreak, type LogEntry } from '@/lib/streaks';

const today = '2026-05-11'; // Monday

function log(date: string, completed = true, value: number | null = null): LogEntry {
  return { date, completed, value };
}

describe('calculateStreak — daily cadence', () => {
  it('returns inactive when no logs exist', () => {
    const r = calculateStreak({ cadence: 'daily', logs: [], today });
    expect(r).toEqual({ current: 0, longest: 0, status: 'inactive' });
  });

  it('counts a single hit today as active=1', () => {
    const logs = [log(today)];
    const r = calculateStreak({ cadence: 'daily', logs, today });
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
    expect(r.status).toBe('active');
  });

  it('extends streak across consecutive days', () => {
    const logs = [log('2026-05-09'), log('2026-05-10'), log('2026-05-11')];
    const r = calculateStreak({ cadence: 'daily', logs, today });
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
    expect(r.status).toBe('active');
  });

  it('today not yet logged but yesterday hit — status still active, current excludes today', () => {
    const logs = [log('2026-05-09'), log('2026-05-10')];
    const r = calculateStreak({ cadence: 'daily', logs, today });
    expect(r.current).toBe(2); // yesterday + day before
    expect(r.status).toBe('active'); // yesterday hit, not broken
  });

  it('yesterday missed but day before hit — missed_once', () => {
    const logs = [log('2026-05-09')];
    const r = calculateStreak({ cadence: 'daily', logs, today });
    expect(r.status).toBe('missed_once');
    expect(r.current).toBe(0); // streak broken; today not done
  });

  it('previous two days missed — broken', () => {
    const logs = [log('2026-05-01'), log('2026-05-02')];
    const r = calculateStreak({ cadence: 'daily', logs, today });
    expect(r.status).toBe('broken');
  });

  it('quantitative — value below target does not count', () => {
    const logs = [
      log('2026-05-10', false, 15),
      log('2026-05-11', false, 25),
    ];
    const r = calculateStreak({ cadence: 'daily', target: 20, logs, today });
    // today: 25 >= 20 → satisfied. yesterday: 15 < 20 → miss.
    expect(r.current).toBe(1);
  });
});

describe('calculateStreak — weekdays cadence', () => {
  // 2026-05-09 = Sat, 2026-05-10 = Sun, 2026-05-11 = Mon
  it('skips weekends', () => {
    const fridayBefore = '2026-05-08';
    const logs = [log(fridayBefore), log(today)];
    const r = calculateStreak({ cadence: 'weekdays', logs, today });
    expect(r.current).toBe(2);
    expect(r.status).toBe('active');
  });

  it('weekend with no log does not break streak', () => {
    const logs = [log('2026-05-08'), log(today)]; // Fri + Mon
    const r = calculateStreak({ cadence: 'weekdays', logs, today });
    expect(r.current).toBe(2);
  });
});

describe('calculateStreak — weekly cadence', () => {
  it('this week satisfied counts as 1', () => {
    const logs = [log(today)];
    const r = calculateStreak({ cadence: 'weekly', logs, today });
    expect(r.current).toBe(1);
  });

  it('two consecutive weeks counted', () => {
    const logs = [log('2026-05-04'), log(today)]; // prior Mon + this Mon
    const r = calculateStreak({ cadence: 'weekly', logs, today });
    expect(r.current).toBe(2);
  });

  it('weekly with quantitative aggregates across the week', () => {
    const logs = [
      log('2026-05-04', false, 1),
      log('2026-05-06', false, 1),
      log('2026-05-08', false, 1),
    ];
    const r = calculateStreak({ cadence: 'weekly', target: 2, logs, today: '2026-05-10' });
    expect(r.current).toBeGreaterThanOrEqual(1);
  });
});
