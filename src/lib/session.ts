import 'server-only';
import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = {
  authenticated: boolean;
  loggedInAt?: number;
};

const password = process.env.SESSION_SECRET ?? '';
if (password.length < 32 && process.env.NODE_ENV === 'production') {
  // Hard fail in prod — refuse to boot with a weak cookie secret.
  throw new Error('SESSION_SECRET must be at least 32 characters');
}

export const sessionOptions: SessionOptions = {
  password: password.padEnd(32, '_'),
  cookieName: 'project-ab-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}
