import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPin } from '@/lib/auth';
import { getSession } from '@/lib/session';

const Body = z.object({ pin: z.string().regex(/^\d{4}$/) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: 'wrong' }, { status: 400 });
  }

  const result = await verifyPin(parsed.data.pin);
  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  const session = await getSession();
  session.authenticated = true;
  session.loggedInAt = Date.now();
  await session.save();
  return NextResponse.json({ ok: true });
}
