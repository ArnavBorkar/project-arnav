'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaIcon } from '@/components/area-icon';
import { StreakBadge } from '@/components/streak-badge';
import type { HabitWithStatus } from '@/lib/habits';
import { toggleHabit, incrementHabit } from '../actions';

function vibrate(ms = 15) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
}

export function HabitRow({ habit }: { habit: HabitWithStatus }) {
  const [optimisticCompleted, setOptimisticCompleted] = React.useState(habit.completedToday);
  const [optimisticValue, setOptimisticValue] = React.useState(habit.valueToday ?? 0);
  const [pending, setPending] = React.useState(false);

  const isQuantitative = habit.targetValue != null && habit.unit;
  const target = habit.targetValue ?? 0;

  async function onToggle() {
    if (pending) return;
    if (isQuantitative) return;
    const next = !optimisticCompleted;
    setOptimisticCompleted(next);
    setPending(true);
    vibrate(next ? 15 : 8);
    try {
      await toggleHabit({ habitId: habit.id, completed: next });
    } catch {
      setOptimisticCompleted(!next);
    } finally {
      setPending(false);
    }
  }

  async function onIncrement(step: number) {
    if (pending) return;
    setPending(true);
    const next = Math.max(0, optimisticValue + step);
    setOptimisticValue(next);
    setOptimisticCompleted(target > 0 && next >= target);
    vibrate(10);
    try {
      await incrementHabit({ habitId: habit.id, delta: step });
    } catch {
      setOptimisticValue(optimisticValue);
    } finally {
      setPending(false);
    }
  }

  const done = optimisticCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-surface px-3 py-3 transition-colors',
        done ? 'border-primary/40 bg-primary/[0.05]' : 'border-border'
      )}
    >
      <button
        type="button"
        onClick={isQuantitative ? () => onIncrement(stepFor(habit)) : onToggle}
        disabled={pending}
        aria-pressed={done}
        aria-label={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'}`}
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95',
          done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface-elevated text-muted-foreground hover:text-foreground'
        )}
      >
        {done ? (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </motion.span>
        ) : isQuantitative ? (
          <Plus className="h-4 w-4" />
        ) : (
          <AreaIcon area={habit.area} className="h-4 w-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('truncate text-sm font-medium', done && 'text-foreground')}>{habit.name}</span>
        </div>
        {isQuantitative ? (
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono tabular text-foreground/80">
              {optimisticValue}
            </span>
            <span>/ {target} {habit.unit}</span>
          </div>
        ) : (
          habit.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{habit.description}</p>
          )
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <StreakBadge streak={habit.streak} />
      </div>
    </motion.div>
  );
}

function stepFor(h: HabitWithStatus): number {
  if (h.unit === 'glasses' || h.unit === 'pings' || h.unit === 'blocks') return 1;
  if (h.unit === 'L') return 0.5;
  if (h.unit === 'pages') return 5;
  if (h.unit === 'minutes' || h.unit === 'min') return 5;
  if (h.unit === 'sessions') return 1;
  if (h.unit === 'hours') return 1;
  if (h.unit === 'calls' || h.unit === 'contacts') return 1;
  if (h.unit === 'rating') return 1;
  return 1;
}
