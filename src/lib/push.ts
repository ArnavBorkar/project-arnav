import 'server-only';
import webpush from 'web-push';
import { db } from '../../db/client';
import { pushSubscriptions } from '../../db/schema';
import { eq } from 'drizzle-orm';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || 'mailto:arnav@e6x.io';
  if (!pub || !priv) {
    throw new Error('VAPID keys are not configured. Run `npm run vapid:generate` and set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.');
  }
  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Sends a push to one subscription. Returns false if the sub is gone (410). */
export async function sendOne(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    const code = (err as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
      return false;
    }
    console.error('Push send failed', err);
    return false;
  }
}

/** Sends a push to every registered subscription. */
export async function sendToAll(payload: PushPayload): Promise<{ sent: number; pruned: number }> {
  const subs = await db.select().from(pushSubscriptions);
  let sent = 0;
  let pruned = 0;
  for (const s of subs) {
    const ok = await sendOne({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload);
    if (ok) sent++;
    else pruned++;
  }
  return { sent, pruned };
}
