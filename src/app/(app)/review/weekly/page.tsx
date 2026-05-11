import { desc, eq } from 'drizzle-orm';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO, format } from 'date-fns';
import { db } from '../../../../../db/client';
import { weeklyReviews } from '../../../../../db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_TZ, todayISO } from '@/lib/time';
import { getWeeklyStats, priorWeekOf, mondayOf } from '@/lib/reviews';
import { WeeklyReviewForm } from './form';

export const dynamic = 'force-dynamic';

export default async function WeeklyReviewPage({ searchParams }: { searchParams: { week?: string } }) {
  const today = todayISO();
  const weekStart = searchParams.week && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week)
    ? mondayOf(searchParams.week)
    : mondayOf(today);

  // Banner highlight Sundays after 4pm
  const dow = parseISO(today).getDay(); // 0=Sun
  const hour = Number(formatInTimeZone(new Date(), APP_TZ, 'H'));
  const showBanner = dow === 0 && hour >= 16;

  const [thisWeekStats, lastWeekStats] = await Promise.all([
    getWeeklyStats(weekStart),
    getWeeklyStats(priorWeekOf(weekStart)),
  ]);

  const existing = await db
    .select()
    .from(weeklyReviews)
    .where(eq(weeklyReviews.weekStarting, weekStart))
    .limit(1);

  const past = await db
    .select()
    .from(weeklyReviews)
    .orderBy(desc(weeklyReviews.weekStarting))
    .limit(8);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Weekly review</h1>
        <p className="text-xs text-muted-foreground">
          Week of {format(parseISO(weekStart), 'd MMM yyyy')}
        </p>
      </header>

      {showBanner && !existing.length && (
        <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Sunday — block out an hour and reflect. The week is almost done.
        </div>
      )}

      <StatsCard current={thisWeekStats} prior={lastWeekStats} />

      <WeeklyReviewForm
        weekStarting={weekStart}
        initial={
          existing[0] ?? {
            q1Worked: null,
            q2DidntWork: null,
            q3StreakAtRisk: null,
            q4ShipTarget: null,
            q5CallOverdue: null,
          }
        }
      />

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past reviews</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {past.map((r) => (
              <a
                key={r.id}
                href={`/review/weekly?week=${r.weekStarting}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm hover:border-primary/40"
              >
                <span>Week of {format(parseISO(String(r.weekStarting)), 'd MMM yyyy')}</span>
                <Badge variant="outline">
                  {r.submittedAt ? format(new Date(r.submittedAt as unknown as string), 'd MMM') : '—'}
                </Badge>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsCard({
  current,
  prior,
}: {
  current: Awaited<ReturnType<typeof getWeeklyStats>>;
  prior: Awaited<ReturnType<typeof getWeeklyStats>>;
}) {
  type Row = { label: string; cur: string; prev: string; delta: number | null; positive: boolean };
  const rows: Row[] = [
    {
      label: 'Sleep avg (h)',
      cur: fmt(current.avgSleepHours, 1),
      prev: fmt(prior.avgSleepHours, 1),
      delta: delta(current.avgSleepHours, prior.avgSleepHours),
      positive: true,
    },
    {
      label: 'Gym sessions',
      cur: String(current.gymSessions),
      prev: String(prior.gymSessions),
      delta: current.gymSessions - prior.gymSessions,
      positive: true,
    },
    {
      label: 'Water avg (L)',
      cur: fmt(current.avgWaterL, 1),
      prev: fmt(prior.avgWaterL, 1),
      delta: delta(current.avgWaterL, prior.avgWaterL),
      positive: true,
    },
    {
      label: 'Pages read',
      cur: String(current.pagesRead),
      prev: String(prior.pagesRead),
      delta: current.pagesRead - prior.pagesRead,
      positive: true,
    },
    {
      label: 'IG min avg',
      cur: fmt(current.avgIgMinutes, 0),
      prev: fmt(prior.avgIgMinutes, 0),
      delta: delta(current.avgIgMinutes, prior.avgIgMinutes),
      positive: false,
    },
    {
      label: 'Hard-stop hits',
      cur: `${current.hardStopHits}/7`,
      prev: `${prior.hardStopHits}/7`,
      delta: current.hardStopHits - prior.hardStopHits,
      positive: true,
    },
    {
      label: 'Family calls',
      cur: String(current.familyCalls),
      prev: String(prior.familyCalls),
      delta: current.familyCalls - prior.familyCalls,
      positive: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>This week vs last</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium">Metric</th>
              <th className="text-right font-medium">This</th>
              <th className="text-right font-medium">Last</th>
              <th className="text-right font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const good = r.delta == null || r.delta === 0
                ? null
                : r.positive
                  ? r.delta > 0
                  : r.delta < 0;
              return (
                <tr key={r.label} className="border-t border-border/70">
                  <td className="py-1.5 pr-2 text-foreground/85">{r.label}</td>
                  <td className="py-1.5 text-right font-mono">{r.cur}</td>
                  <td className="py-1.5 text-right font-mono text-muted-foreground">{r.prev}</td>
                  <td className={`py-1.5 text-right font-mono ${good == null ? 'text-muted-foreground' : good ? 'text-success' : 'text-streak-missed'}`}>
                    {r.delta == null ? '—' : (r.delta > 0 ? '+' : '') + (Number.isInteger(r.delta) ? r.delta : r.delta.toFixed(1))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function fmt(v: number | null, decimals: number): string {
  if (v == null) return '—';
  if (Number.isInteger(v) || decimals === 0) return Math.round(v).toString();
  return v.toFixed(decimals);
}

function delta(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return a - b;
}
