import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.authenticated) return NextResponse.json({ ok: false }, { status: 401 });
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 500 });
  return NextResponse.json({ publicKey: key });
}
