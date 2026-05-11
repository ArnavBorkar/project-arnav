import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtNumber(n: number | null | undefined, opts: { decimals?: number } = {}): string {
  if (n == null || Number.isNaN(n)) return '—';
  const { decimals = 1 } = opts;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(decimals);
}
