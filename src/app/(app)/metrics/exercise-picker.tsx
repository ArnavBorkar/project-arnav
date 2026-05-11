'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export function ExercisePicker({ exercises, current }: { exercises: string[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set('lift', e.target.value);
        router.replace('/metrics?' + next.toString());
      }}
      className="h-10 rounded-xl border border-border bg-surface-elevated px-3 text-sm"
    >
      {exercises.map((ex) => (
        <option key={ex} value={ex}>
          {ex}
        </option>
      ))}
    </select>
  );
}
