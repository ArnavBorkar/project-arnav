'use client';

import * as React from 'react';
import { Plus, Droplet, BookOpen, Smile, Bed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { incrementHabit, logMood, logSleepQuality } from '../actions';

interface Props {
  waterHabitId: number | null;
  pagesHabitId: number | null;
  showSleepCard: boolean;
  sleepQualityToday: number | null;
  moodToday: number | null;
}

export function QuickLog({ waterHabitId, pagesHabitId, showSleepCard, sleepQualityToday, moodToday }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-transform active:scale-95"
        aria-label="Quick log"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick log</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {waterHabitId && (
              <QuickRow
                icon={<Droplet className="h-5 w-5" />}
                label="Water"
                unit="glasses (≈250ml)"
                onTap={async () => {
                  await incrementHabit({ habitId: waterHabitId, delta: 0.25 });
                }}
              />
            )}
            {pagesHabitId && (
              <QuickRow
                icon={<BookOpen className="h-5 w-5" />}
                label="Pages read"
                unit="+5"
                onTap={async () => {
                  await incrementHabit({ habitId: pagesHabitId, delta: 5 });
                }}
              />
            )}
            <RatingRow
              icon={<Smile className="h-5 w-5" />}
              label="Mood"
              value={moodToday}
              onSelect={async (v) => {
                await logMood({ mood15: v });
              }}
            />
            {showSleepCard && (
              <RatingRow
                icon={<Bed className="h-5 w-5" />}
                label="Felt rested"
                value={sleepQualityToday}
                onSelect={async (v) => {
                  await logSleepQuality({ quality15: v });
                }}
              />
            )}
          </div>
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuickRow({
  icon,
  label,
  unit,
  onTap,
}: {
  icon: React.ReactNode;
  label: string;
  unit?: string;
  onTap: () => Promise<void>;
}) {
  const [bumping, setBumping] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setBumping(true);
        await onTap();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(10);
        setTimeout(() => setBumping(false), 250);
      }}
      className={cn(
        'flex items-center justify-between rounded-xl border border-border bg-surface-elevated px-4 py-3 text-left transition-transform',
        bumping && 'scale-[0.98]'
      )}
    >
      <span className="flex items-center gap-3 text-sm">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      {unit && <span className="font-mono text-xs text-muted-foreground">{unit}</span>}
    </button>
  );
}

function RatingRow({
  icon,
  label,
  value,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  onSelect: (v: number) => Promise<void>;
}) {
  const [local, setLocal] = React.useState<number | null>(value);
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3">
      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className="text-primary">{icon}</span>
        {label}
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {local != null ? `${local}/5` : '—'}
        </span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={async () => {
              setLocal(n);
              await onSelect(n);
            }}
            className={cn(
              'h-10 flex-1 rounded-lg border font-mono text-sm transition-colors',
              local === n
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {n}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
