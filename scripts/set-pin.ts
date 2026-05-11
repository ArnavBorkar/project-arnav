#!/usr/bin/env node
/**
 * Generate a bcrypt hash for the 4-digit PIN.
 *
 * Modes:
 *   npm run set-pin                 → prompts for PIN; prints hash to stdout AND writes to local DB
 *   npm run set-pin -- 1234         → uses argv PIN (avoid in shared terminals — appears in history)
 *   npm run set-pin -- --print-only → prompts; only prints hash, does NOT touch the DB
 *
 * Why both: locally, writing to the DB avoids `.env` $-expansion gotchas with bcrypt hashes.
 * For Vercel, you'll paste the printed hash into the `PIN_HASH` env var (Vercel handles `$` correctly).
 *
 * Never logs the raw PIN.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { createInterface } from 'node:readline';
import { db } from '../db/client';
import { appState } from '../db/schema';

function readStdinPin(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question('Enter 4-digit PIN: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function writeHashToDb(hash: string) {
  const existing = await db.select().from(appState).limit(1);
  if (existing.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(appState).values({
      id: 1,
      currentPhase: 1,
      phaseStartedAt: today,
      pinHash: hash,
    });
    return;
  }
  await db
    .update(appState)
    .set({ pinHash: hash, failedLoginAttempts: 0, lockedUntil: null })
    .where(sql`${appState.id} = 1`);
}

async function main() {
  const args = process.argv.slice(2);
  const printOnly = args.includes('--print-only');
  const pinArg = args.find((a) => /^\d{4}$/.test(a));
  const pin = pinArg ?? (await readStdinPin());

  if (!/^\d{4}$/.test(pin)) {
    console.error('Error: PIN must be exactly 4 digits.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(pin, 10);
  process.stdout.write(hash + '\n');

  if (!printOnly) {
    try {
      await writeHashToDb(hash);
      console.error('');
      console.error('✓ Local DB updated. You can log in now with this PIN.');
    } catch (err) {
      console.error('');
      console.error('Could not write to DB (' + (err instanceof Error ? err.message : 'unknown') + ').');
      console.error('That is OK — paste the hash above into the PIN_HASH env var.');
    }
  }

  console.error('');
  console.error('For Vercel: paste this into Project → Settings → Environment Variables → PIN_HASH:');
  console.error('  ' + hash);
  console.error('(Vercel handles `$` chars correctly. In local .env files, single-quote the value.)');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
