'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, nowForTimestamp } from '../../../../db/client';
import {
  gymSessions,
  exerciseSets,
  meals,
  bodyMetrics,
  financeSnapshots,
  screenTimeLogs,
} from '../../../../db/schema';
import { todayISO } from '@/lib/time';

const ExerciseSetSchema = z.object({
  exercise: z.string().min(1),
  weightKg: z.number().nonnegative().nullable(),
  reps: z.number().int().nonnegative().nullable(),
  setNumber: z.number().int().positive(),
});

const GymSessionSchema = z.object({
  type: z.enum(['push', 'pull', 'legs', 'upper', 'cardio', 'custom']),
  notes: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  sets: z.array(ExerciseSetSchema).min(1),
});

export async function logGymSession(input: z.infer<typeof GymSessionSchema>) {
  const parsed = GymSessionSchema.parse(input);
  const date = todayISO();
  const [inserted] = await db
    .insert(gymSessions)
    .values({
      date,
      type: parsed.type,
      notes: parsed.notes ?? null,
      durationMinutes: parsed.durationMinutes ?? null,
    })
    .returning({ id: gymSessions.id });

  await db.insert(exerciseSets).values(
    parsed.sets.map((s) => ({
      sessionId: inserted.id,
      exercise: s.exercise,
      weightKg: s.weightKg != null ? (s.weightKg as unknown as string) : null,
      reps: s.reps,
      setNumber: s.setNumber,
    }))
  );
  revalidatePath('/log');
  revalidatePath('/metrics');
}

const MealSchema = z.object({
  type: z.enum(['breakfast', 'lunch', 'snack', 'dinner']),
  onTime: z.boolean(),
  proteinHit: z.boolean(),
  description: z.string().max(500).optional(),
});

export async function logMeal(input: z.infer<typeof MealSchema>) {
  const parsed = MealSchema.parse(input);
  await db.insert(meals).values({
    datetime: nowForTimestamp() as unknown as Date,
    type: parsed.type,
    onTime: parsed.onTime,
    proteinHit: parsed.proteinHit,
    description: parsed.description ?? null,
  });
  revalidatePath('/log');
}

const BodyMetricSchema = z.object({
  weightKg: z.number().positive(),
  waistCm: z.number().positive().nullable(),
  notes: z.string().max(500).optional(),
});

export async function logBodyMetric(input: z.infer<typeof BodyMetricSchema>) {
  const parsed = BodyMetricSchema.parse(input);
  const date = todayISO();
  await db.insert(bodyMetrics).values({
    date,
    weightKg: parsed.weightKg as unknown as string,
    waistCm: parsed.waistCm != null ? (parsed.waistCm as unknown as string) : null,
    notes: parsed.notes ?? null,
  });
  revalidatePath('/log');
  revalidatePath('/metrics');
}

const FinanceSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  netWorth: z.number(),
  monthlySpend: z.number().nonnegative(),
  savingsRate: z.number().min(0).max(1),
  notes: z.string().max(2000).optional(),
});

export async function logFinanceSnapshot(input: z.infer<typeof FinanceSchema>) {
  const parsed = FinanceSchema.parse(input);
  const existing = await db
    .select()
    .from(financeSnapshots)
    .where(eq(financeSnapshots.month, parsed.month))
    .limit(1);
  const values = {
    netWorth: parsed.netWorth as unknown as string,
    monthlySpend: parsed.monthlySpend as unknown as string,
    savingsRate: parsed.savingsRate as unknown as string,
    notes: parsed.notes ?? null,
  };
  if (existing.length > 0) {
    await db.update(financeSnapshots).set(values).where(eq(financeSnapshots.id, existing[0].id));
  } else {
    await db.insert(financeSnapshots).values({ month: parsed.month, ...values });
  }
  revalidatePath('/log');
}

const ScreenTimeSchema = z.object({
  instagramMinutes: z.number().int().nonnegative(),
  whatsappMinutes: z.number().int().nonnegative(),
  totalPhoneMinutes: z.number().int().nonnegative(),
});

export async function logScreenTime(input: z.infer<typeof ScreenTimeSchema>) {
  const parsed = ScreenTimeSchema.parse(input);
  const date = todayISO();
  const existing = await db.select().from(screenTimeLogs).where(eq(screenTimeLogs.date, date)).limit(1);
  if (existing.length > 0) {
    await db.update(screenTimeLogs).set(parsed).where(eq(screenTimeLogs.id, existing[0].id));
  } else {
    await db.insert(screenTimeLogs).values({ date, ...parsed });
  }
  revalidatePath('/log');
  revalidatePath('/metrics');
}
