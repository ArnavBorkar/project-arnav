#!/usr/bin/env node
/**
 * Generate a bcrypt hash for the 4-digit PIN, ready to paste into Vercel `PIN_HASH`.
 *
 * Usage:
 *   npm run set-pin            # prompts on stdin
 *   npm run set-pin -- 1234    # reads from argv (avoid in shared terminals — appears in history)
 *
 * Never logs the raw PIN.
 */
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline';

function readStdinPin(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question('Enter 4-digit PIN: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const fromArgv = process.argv[2];
  const pin = fromArgv ? fromArgv.trim() : await readStdinPin();
  if (!/^\d{4}$/.test(pin)) {
    console.error('Error: PIN must be exactly 4 digits.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(pin, 10);
  // Print ONLY the hash on stdout so it's pipe-friendly.
  process.stdout.write(hash + '\n');
  console.error('');
  console.error('Paste this into your environment:');
  console.error('  PIN_HASH=' + hash);
  console.error('');
  console.error('On Vercel: Project → Settings → Environment Variables → add PIN_HASH.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
