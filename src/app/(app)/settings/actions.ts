'use server';

import { revalidatePath } from 'next/cache';
import { sql, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../../db/client';
import { appState, habits, pushSubscriptions } from '../../../../db/schema';
import { verifyPin, setPin } from '@/lib/auth';
import { todayISO } from '@/lib/time';

const RotatePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4}$/),
  newPin: z.string().regex(/^\d{4}$/),
});

export async function rotatePin(input: z.infer<typeof RotatePinSchema>) {
  const parsed = RotatePinSchema.parse(input);
  const check = await verifyPin(parsed.currentPin);
  if (!check.ok) {
    return { ok: false, reason: check.reason ?? 'wrong' };
  }
  await setPin(parsed.newPin);
  return { ok: true };
}

export async function advancePhase() {
  const [state] = await db.select().from(appState).limit(1);
  const next = Math.min(4, (state?.currentPhase ?? 1) + 1);
  await db
    .update(appState)
    .set({ currentPhase: next, phaseStartedAt: todayISO() })
    .where(sql`${appState.id} = 1`);
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true, phase: next };
}

export async function regressPhase() {
  const [state] = await db.select().from(appState).limit(1);
  const next = Math.max(1, (state?.currentPhase ?? 1) - 1);
  await db
    .update(appState)
    .set({ currentPhase: next, phaseStartedAt: todayISO() })
    .where(sql`${appState.id} = 1`);
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true, phase: next };
}

const ToggleArchivedSchema = z.object({
  habitId: z.number().int().positive(),
  archived: z.boolean(),
});

export async function toggleHabitArchived(input: z.infer<typeof ToggleArchivedSchema>) {
  const parsed = ToggleArchivedSchema.parse(input);
  await db.update(habits).set({ archived: parsed.archived }).where(eq(habits.id, parsed.habitId));
  revalidatePath('/');
  revalidatePath('/streaks');
  revalidatePath('/settings');
}

const NotifPrefsSchema = z.object({
  enabled: z.boolean(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function updateNotificationPrefs(input: z.infer<typeof NotifPrefsSchema>) {
  const parsed = NotifPrefsSchema.parse(input);
  await db
    .update(appState)
    .set({
      notificationsEnabled: parsed.enabled,
      quietHoursStart: parsed.quietHoursStart,
      quietHoursEnd: parsed.quietHoursEnd,
    })
    .where(sql`${appState.id} = 1`);
  revalidatePath('/settings');
}

export async function removePushSubscription(id: number) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  revalidatePath('/settings');
}

