import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db/client';
import { pushSubscriptions } from '../../../../../db/schema';
import { getSession } from '@/lib/session';

const Schema = z.object({ endpoint: z.string().url() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.authenticated) return NextResponse.json({ ok: false }, { status: 401 });
  const body = Schema.parse(await request.json());
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, body.endpoint));
  return NextResponse.json({ ok: true });
}
