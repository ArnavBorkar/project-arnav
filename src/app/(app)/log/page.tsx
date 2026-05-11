import { sql } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { exerciseSets } from '../../../../db/schema';
import { todayISO } from '@/lib/time';
import { GymForm } from './gym-form';
import { MealForm } from './meal-form';
import { BodyForm } from './body-form';
import { FinanceForm } from './finance-form';
import { ScreenTimeForm } from './screen-time-form';

export const dynamic = 'force-dynamic';

export default async function LogPage({ searchParams }: { searchParams: { force?: string } }) {
  const today = todayISO();
  const day = Number(today.slice(-2));
  const isFirstWeekOfMonth = day >= 1 && day <= 7;
  const financeEnabled = isFirstWeekOfMonth || searchParams.force === '1';

  const exerciseRows = await db
    .selectDistinct({ exercise: exerciseSets.exercise })
    .from(exerciseSets);
  const exercises = exerciseRows.map((r) => r.exercise).sort();

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Log</h1>
        <p className="text-xs text-muted-foreground">Manual entry hub. Fast forms, no clutter.</p>
      </header>

      <GymForm exerciseSuggestions={exercises} />
      <MealForm />
      <BodyForm />
      <FinanceForm enabled={financeEnabled} todayISO={today} />
      <ScreenTimeForm />
    </div>
  );
}
