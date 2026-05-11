import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sendToAll } from '@/lib/push';

export async function POST() {
  const session = await getSession();
  if (!session.authenticated) return NextResponse.json({ ok: false }, { status: 401 });

  const result = await sendToAll({
    title: 'Project AB',
    body: 'Test ping — push notifications are working.',
    url: '/',
    tag: 'test',
  });
  return NextResponse.json({ ok: true, ...result });
}
