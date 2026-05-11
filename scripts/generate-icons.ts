#!/usr/bin/env node
/**
 * Render PWA icons (192, 512, apple-touch 180) from the Logo SVG.
 * Run: tsx scripts/generate-icons.ts
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFB546"/>
      <stop offset="100%" stop-color="#E0A85A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#0A0A0B"/>
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="#26262B" stroke-width="8"/>
  <!-- A -->
  <path d="M118 376 L194 140 L270 376 M148 296 L240 296" fill="none" stroke="url(#g)" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- B -->
  <path d="M310 140 L310 376 L374 376 C411 376 435 352 435 322 C435 296 416 274 390 274 L310 274 M310 274 L385 274 C411 274 427 252 427 226 C427 199 406 178 379 178 L310 178 Z" fill="none" stroke="url(#g)" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const targets = [
  { size: 192, path: 'public/icons/icon-192.png' },
  { size: 512, path: 'public/icons/icon-512.png' },
  { size: 180, path: 'public/icons/apple-touch-icon.png' },
  { size: 32, path: 'public/favicon-32.png' },
  { size: 16, path: 'public/favicon-16.png' },
];

async function main() {
  for (const t of targets) {
    const buf = await sharp(Buffer.from(svg)).resize(t.size, t.size).png().toBuffer();
    const out = join(process.cwd(), t.path);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, buf);
    console.log('wrote', t.path);
  }

  // also write a 48px favicon.ico-friendly png fallback
  const fav = await sharp(Buffer.from(svg)).resize(48, 48).png().toBuffer();
  await writeFile(join(process.cwd(), 'public/favicon.ico'), fav);
  console.log('wrote public/favicon.ico (PNG-encoded)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
