'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../db/client';
import { sleepLogs, moodLogs } from '../../../db/schema';
import { toggleHabitLog, incrementHabitLog } from '@/lib/habits';
import { todayISO } from '@/lib/time';

const ToggleSchema = z.object({
  habitId: z.number().int().positive(),
  completed: z.boolean(),
});

export async function toggleHabit(input: z.infer<typeof ToggleSchema>) {
  const parsed = ToggleSchema.parse(input);
  await toggleHabitLog(parsed.habitId, todayISO(), parsed.completed);
  revalidatePath('/');
}

const IncrementSchema = z.object({
  habitId: z.number().int().positive(),
  delta: z.number(),
});

export async function incrementHabit(input: z.infer<typeof IncrementSchema>) {
  const parsed = IncrementSchema.parse(input);
  await incrementHabitLog(parsed.habitId, todayISO(), parsed.delta);
  revalidatePath('/');
}

const SleepSchema = z.object({
  quality15: z.number().int().min(1).max(5),
});

export async function logSleepQuality(input: z.infer<typeof SleepSchema>) {
  const parsed = SleepSchema.parse(input);
  const date = todayISO();
  const existing = await db.select().from(sleepLogs).where(eq(sleepLogs.date, date)).limit(1);
  if (existing.length > 0) {
    await db.update(sleepLogs).set({ quality15: parsed.quality15 }).where(eq(sleepLogs.id, existing[0].id));
  } else {
    await db.insert(sleepLogs).values({ date, quality15: parsed.quality15 });
  }
  revalidatePath('/');
  revalidatePath('/metrics');
}

const MoodSchema = z.object({
  mood15: z.number().int().min(1).max(5),
});

export async function logMood(input: z.infer<typeof MoodSchema>) {
  const parsed = MoodSchema.parse(input);
  const date = todayISO();
  const existing = await db.select().from(moodLogs).where(eq(moodLogs.date, date)).limit(1);
  if (existing.length > 0) {
    await db.update(moodLogs).set({ mood15: parsed.mood15 }).where(eq(moodLogs.id, existing[0].id));
  } else {
    await db.insert(moodLogs).values({ date, mood15: parsed.mood15 });
  }
  revalidatePath('/');
}
