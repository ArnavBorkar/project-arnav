import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db/client';
import { pushSubscriptions } from '../../../../../db/schema';
import { getSession } from '@/lib/session';

const Schema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  deviceLabel: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.authenticated) return NextResponse.json({ ok: false }, { status: 401 });

  const body = Schema.parse(await request.json());

  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, body.endpoint))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(pushSubscriptions).values({
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
      deviceLabel: body.deviceLabel ?? null,
    });
  } else {
    await db
      .update(pushSubscriptions)
      .set({ p256dh: body.p256dh, auth: body.auth, deviceLabel: body.deviceLabel ?? existing[0].deviceLabel })
      .where(eq(pushSubscriptions.endpoint, body.endpoint));
  }
  return NextResponse.json({ ok: true });
}
