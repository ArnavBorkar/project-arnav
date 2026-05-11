'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, nowForTimestamp } from '../../../../../db/client';
import { quarterlyReviews } from '../../../../../db/schema';
import { uploadPhoto } from '@/lib/storage';

const Schema = z.object({
  quarterStarting: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().nullable(),
  waistCm: z.number().nullable(),
  netWorth: z.number().nullable(),
  reflection: z.string().max(5000).optional(),
  nextQuarterTheme: z.string().max(200).optional(),
});

export async function submitQuarterlyReview(formData: FormData) {
  const quarter = String(formData.get('quarterStarting') ?? '');
  const weightStr = String(formData.get('weightKg') ?? '');
  const waistStr = String(formData.get('waistCm') ?? '');
  const netWorthStr = String(formData.get('netWorth') ?? '');
  const reflection = String(formData.get('reflection') ?? '');
  const nextTheme = String(formData.get('nextQuarterTheme') ?? '');

  const parsed = Schema.parse({
    quarterStarting: quarter,
    weightKg: weightStr ? Number(weightStr) : null,
    waistCm: waistStr ? Number(waistStr) : null,
    netWorth: netWorthStr ? Number(netWorthStr) : null,
    reflection: reflection || undefined,
    nextQuarterTheme: nextTheme || undefined,
  });

  let frontUrl: string | null = null;
  let sideUrl: string | null = null;

  const front = formData.get('photoFront');
  if (front instanceof File && front.size > 0) {
    const buf = await front.arrayBuffer();
    frontUrl = await uploadPhoto(buf, `qr-${parsed.quarterStarting}-front-${front.name}`, front.type || 'image/jpeg');
  }
  const side = formData.get('photoSide');
  if (side instanceof File && side.size > 0) {
    const buf = await side.arrayBuffer();
    sideUrl = await uploadPhoto(buf, `qr-${parsed.quarterStarting}-side-${side.name}`, side.type || 'image/jpeg');
  }

  const existing = await db
    .select()
    .from(quarterlyReviews)
    .where(eq(quarterlyReviews.quarterStarting, parsed.quarterStarting))
    .limit(1);

  const payload = {
    weightKg: parsed.weightKg != null ? (parsed.weightKg as unknown as string) : null,
    waistCm: parsed.waistCm != null ? (parsed.waistCm as unknown as string) : null,
    netWorth: parsed.netWorth != null ? (parsed.netWorth as unknown as string) : null,
    reflection: parsed.reflection ?? null,
    nextQuarterTheme: parsed.nextQuarterTheme ?? null,
    photoFrontUrl: frontUrl ?? existing[0]?.photoFrontUrl ?? null,
    photoSideUrl: sideUrl ?? existing[0]?.photoSideUrl ?? null,
    submittedAt: nowForTimestamp() as unknown as Date,
  };

  if (existing.length > 0) {
    await db.update(quarterlyReviews).set(payload).where(eq(quarterlyReviews.id, existing[0].id));
  } else {
    await db.insert(quarterlyReviews).values({ quarterStarting: parsed.quarterStarting, ...payload });
  }
  revalidatePath('/review/quarterly');
}
