'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../../../db/client';
import { weeklyReviews } from '../../../../../db/schema';

const Schema = z.object({
  weekStarting: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  q1Worked: z.string().max(2000).optional(),
  q2DidntWork: z.string().max(2000).optional(),
  q3StreakAtRisk: z.string().max(2000).optional(),
  q4ShipTarget: z.string().max(2000).optional(),
  q5CallOverdue: z.string().max(2000).optional(),
});

export async function submitWeeklyReview(input: z.infer<typeof Schema>) {
  const parsed = Schema.parse(input);
  const existing = await db
    .select()
    .from(weeklyReviews)
    .where(eq(weeklyReviews.weekStarting, parsed.weekStarting))
    .limit(1);

  const payload = {
    q1Worked: parsed.q1Worked ?? null,
    q2DidntWork: parsed.q2DidntWork ?? null,
    q3StreakAtRisk: parsed.q3StreakAtRisk ?? null,
    q4ShipTarget: parsed.q4ShipTarget ?? null,
    q5CallOverdue: parsed.q5CallOverdue ?? null,
    submittedAt: new Date() as unknown as Date,
  };

  if (existing.length > 0) {
    await db.update(weeklyReviews).set(payload).where(eq(weeklyReviews.id, existing[0].id));
  } else {
    await db.insert(weeklyReviews).values({ weekStarting: parsed.weekStarting, ...payload });
  }
  revalidatePath('/review/weekly');
}
