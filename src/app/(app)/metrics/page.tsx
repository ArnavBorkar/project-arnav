import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MiniLineChart } from '@/components/charts/line-chart';
import { DualAxisChart } from '@/components/charts/dual-axis-chart';
import {
  getWeightSeries,
  getSleepSeries,
  getHabitValueSeries,
  getScreenTimeSeries,
  getReadingPagesSeries,
  getExerciseProgression,
  listKnownExercises,
} from '@/lib/metrics';
import { ExercisePicker } from './exercise-picker';

export const dynamic = 'force-dynamic';

export default async function MetricsPage({ searchParams }: { searchParams: { lift?: string } }) {
  const [weight, sleep, water, igMin, pages, exercises] = await Promise.all([
    getWeightSeries(90),
    getSleepSeries(30),
    getHabitValueSeries('water_intake_3L', 30),
    getScreenTimeSeries(30),
    getReadingPagesSeries(30),
    listKnownExercises(),
  ]);

  const defaultLift = searchParams.lift ?? exercises[0] ?? 'Bench press';
  const liftSeries = await getExerciseProgression(defaultLift, 180);

  const igLineData = igMin.map((r) => ({ date: r.date, value: r.instagram }));

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Metrics</h1>
        <p className="text-xs text-muted-foreground">Trends. Cause-and-effect. No vanity.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Bodyweight (90d)</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLineChart data={weight} unit="kg" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep — duration (h) + quality (1-5) · 30d</CardTitle>
        </CardHeader>
        <CardContent>
          <DualAxisChart data={sleep} leftLabel="Duration" rightLabel="Quality" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Water (L) · 30d</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLineChart data={water} unit="L" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instagram minutes · 30d</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLineChart data={igLineData} unit="m" color="#E0A85A" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pages read · 30d</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLineChart data={pages} unit="p" color="#3DDC97" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lift progression — {defaultLift}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ExercisePicker
            exercises={exercises.length > 0 ? exercises : ['Bench press', 'OHP', 'Squat', 'Deadlift', 'Row']}
            current={defaultLift}
          />
          {liftSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sets logged yet — log a gym session to see progression.</p>
          ) : (
            <MiniLineChart data={liftSeries} unit="kg" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
