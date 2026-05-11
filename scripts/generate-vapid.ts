#!/usr/bin/env node
/**
 * Generate a VAPID keypair for Web Push.
 *
 * Usage: npm run vapid:generate
 * Paste the printed lines into .env (locally) and your Vercel env vars (prod).
 */
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();
process.stdout.write('VAPID_PUBLIC_KEY=' + keys.publicKey + '\n');
process.stdout.write('VAPID_PRIVATE_KEY=' + keys.privateKey + '\n');
console.error('');
console.error('Add both keys to your environment, plus VAPID_SUBJECT=mailto:you@example.com');
