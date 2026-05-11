'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PinPad({ nextPath }: { nextPath?: string }) {
  const [pin, setPin] = React.useState<string[]>(['', '', '', '']);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  React.useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setDigit = (idx: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    setPin((prev) => {
      const next = [...prev];
      next[idx] = clean;
      return next;
    });
    if (clean && idx < 3) inputs.current[idx + 1]?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  React.useEffect(() => {
    if (pin.every((d) => d.length === 1)) {
      void submit(pin.join(''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function submit(value: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.reason === 'locked') {
          const mins = Math.ceil((data.unlocksInMs ?? 0) / 60000);
          setError(`Locked. Try again in ~${mins} min.`);
        } else if (data.reason === 'no_pin_set') {
          setError('No PIN set. Run `npm run set-pin` and set PIN_HASH.');
        } else {
          setError('Wrong PIN. Try again.');
        }
        setPin(['', '', '', '']);
        inputs.current[0]?.focus();
        return;
      }
      router.replace(nextPath || '/');
      router.refresh();
    } catch {
      setError('Network error. Try again.');
      setPin(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(pin.join(''));
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <div className="flex justify-between gap-3">
        {pin.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputs.current[idx] = el;
            }}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(e) => setDigit(idx, e.target.value)}
            onKeyDown={(e) => handleKey(idx, e)}
            className={cn(
              'h-16 w-16 rounded-2xl border bg-surface text-center font-mono text-3xl text-foreground caret-primary focus:outline-none focus:ring-2 focus:ring-primary',
              error ? 'border-destructive' : 'border-border'
            )}
            disabled={pending}
            aria-label={`PIN digit ${idx + 1}`}
          />
        ))}
      </div>
      {error && <p className="text-center text-sm text-streak-missed">{error}</p>}
      <Button type="submit" size="lg" disabled={pending || pin.some((d) => !d)}>
        {pending ? 'Unlocking…' : 'Unlock'}
      </Button>
    </form>
  );
}
