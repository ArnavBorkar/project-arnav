import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Uploads a file. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise writes to /public/uploads (dev fallback).
 *
 * Returns a publicly-fetchable URL.
 */
export async function uploadPhoto(
  bytes: Uint8Array | ArrayBuffer,
  filename: string,
  contentType: string
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import('@vercel/blob');
    const buf = Buffer.from(bytes instanceof ArrayBuffer ? bytes : bytes.buffer);
    const blob = await put(filename, buf, {
      access: 'public',
      contentType,
      token,
      addRandomSuffix: true,
    });
    return blob.url;
  }

  // Local dev fallback — write to public/uploads
  const safeName = filename.replace(/[^a-z0-9.\-_]/gi, '_');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const dir = join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  await writeFile(join(dir, unique), Buffer.from(data));
  return `/uploads/${unique}`;
}
