import 'server-only';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { appState } from '../../db/schema';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export interface PinCheckResult {
  ok: boolean;
  reason?: 'wrong' | 'locked' | 'no_pin_set';
  unlocksInMs?: number;
}

async function getOrCreateState() {
  const rows = await db.select().from(appState).limit(1);
  if (rows.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(appState).values({ id: 1, currentPhase: 1, phaseStartedAt: today });
    return (await db.select().from(appState).limit(1))[0];
  }
  return rows[0];
}

export async function verifyPin(pin: string): Promise<PinCheckResult> {
  if (!/^\d{4}$/.test(pin)) return { ok: false, reason: 'wrong' };

  const state = await getOrCreateState();
  const envHash = process.env.PIN_HASH;
  const pinHash = state.pinHash ?? envHash;

  if (!pinHash) return { ok: false, reason: 'no_pin_set' };

  // Lockout check
  if (state.lockedUntil) {
    const until = new Date(state.lockedUntil);
    const remaining = until.getTime() - Date.now();
    if (remaining > 0) {
      return { ok: false, reason: 'locked', unlocksInMs: remaining };
    }
  }

  const match = await bcrypt.compare(pin, pinHash);

  if (match) {
    await db
      .update(appState)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(sql`${appState.id} = 1`);
    return { ok: true };
  }

  const attempts = (state.failedLoginAttempts ?? 0) + 1;
  if (attempts >= MAX_ATTEMPTS) {
    const until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    await db
      .update(appState)
      .set({ failedLoginAttempts: 0, lockedUntil: until.toISOString() as unknown as Date })
      .where(sql`${appState.id} = 1`);
    return { ok: false, reason: 'locked', unlocksInMs: LOCKOUT_MINUTES * 60 * 1000 };
  }

  await db
    .update(appState)
    .set({ failedLoginAttempts: attempts })
    .where(sql`${appState.id} = 1`);
  return { ok: false, reason: 'wrong' };
}

export async function setPin(newPin: string) {
  if (!/^\d{4}$/.test(newPin)) {
    throw new Error('PIN must be 4 digits');
  }
  const hash = await bcrypt.hash(newPin, 10);
  await getOrCreateState();
  await db
    .update(appState)
    .set({ pinHash: hash, failedLoginAttempts: 0, lockedUntil: null })
    .where(sql`${appState.id} = 1`);
}
