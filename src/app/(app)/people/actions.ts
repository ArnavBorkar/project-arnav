'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../../db/client';
import { people } from '../../../../db/schema';
import { todayISO } from '@/lib/time';

const AddPersonSchema = z.object({
  name: z.string().min(1).max(80),
  relationship: z.string().min(1),
  cadenceDays: z.number().int().min(1).max(365),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(500).optional(),
});

export async function addPerson(input: z.infer<typeof AddPersonSchema>) {
  const parsed = AddPersonSchema.parse(input);
  await db.insert(people).values({
    name: parsed.name,
    relationship: parsed.relationship,
    cadenceDays: parsed.cadenceDays,
    birthday: parsed.birthday || null,
    notes: parsed.notes ?? null,
  });
  revalidatePath('/people');
}

const UpdatePersonSchema = AddPersonSchema.extend({
  id: z.number().int().positive(),
});

export async function updatePerson(input: z.infer<typeof UpdatePersonSchema>) {
  const parsed = UpdatePersonSchema.parse(input);
  await db
    .update(people)
    .set({
      name: parsed.name,
      relationship: parsed.relationship,
      cadenceDays: parsed.cadenceDays,
      birthday: parsed.birthday || null,
      notes: parsed.notes ?? null,
    })
    .where(eq(people.id, parsed.id));
  revalidatePath('/people');
}

export async function archivePerson(id: number) {
  await db.update(people).set({ archived: true }).where(eq(people.id, id));
  revalidatePath('/people');
}

export async function markContacted(id: number) {
  await db.update(people).set({ lastContactedAt: todayISO() }).where(eq(people.id, id));
  revalidatePath('/people');
}
