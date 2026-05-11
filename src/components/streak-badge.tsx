import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreakResult } from '@/lib/streaks';

const colors: Record<StreakResult['status'], string> = {
  active: 'text-streak-active',
  missed_once: 'text-streak-missed',
  broken: 'text-streak-broken',
  inactive: 'text-muted-foreground',
};

export function StreakBadge({ streak }: { streak: StreakResult }) {
  if (streak.status === 'inactive' && streak.current === 0) {
    return <span className="font-mono text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-xs', colors[streak.status])}>
      <Flame className="h-3.5 w-3.5" />
      {streak.current}
    </span>
  );
}
