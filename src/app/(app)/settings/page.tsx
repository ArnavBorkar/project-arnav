import { asc, desc } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { appState, habits as habitsTable, pushSubscriptions } from '../../../../db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PinRotationCard, PhaseCard, HabitListCard, NotificationsCard, PushDevicesCard, ExportCard } from './client';

export const dynamic = 'force-dynamic';

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 — Keystone',
  2: 'Phase 2 — Body',
  3: 'Phase 3 — Mind & Connection',
  4: 'Phase 4 — Optimize',
};

export default async function SettingsPage() {
  const [state] = await db.select().from(appState).limit(1);
  const allHabits = await db.select().from(habitsTable).orderBy(asc(habitsTable.displayOrder));
  const devices = await db.select().from(pushSubscriptions).orderBy(desc(pushSubscriptions.createdAt));

  const phase = state?.currentPhase ?? 1;
  const phaseStartedAt = state?.phaseStartedAt ? String(state.phaseStartedAt) : '—';

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">PIN, phase, habits, notifications, data.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Phase</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Badge variant="default">{PHASE_LABELS[phase]}</Badge>
            <span className="font-mono text-xs text-muted-foreground">started {phaseStartedAt}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Phase 1 takes 14 days minimum. Don&apos;t advance until your sleep is anchored.
          </p>
          <PhaseCard currentPhase={phase} />
        </CardContent>
      </Card>

      <PinRotationCard />

      <NotificationsCard
        enabled={!!state?.notificationsEnabled}
        quietHoursStart={state?.quietHoursStart ?? '00:30'}
        quietHoursEnd={state?.quietHoursEnd ?? '06:55'}
      />

      <PushDevicesCard
        devices={devices.map((d) => ({
          id: d.id,
          deviceLabel: d.deviceLabel,
          createdAt: d.createdAt ? new Date(d.createdAt as unknown as string).toISOString().slice(0, 10) : null,
        }))}
      />

      <HabitListCard
        habits={allHabits.map((h) => ({
          id: h.id,
          slug: h.slug,
          name: h.name,
          area: h.area,
          cadence: h.cadence,
          phaseEnabled: h.phaseEnabled,
          archived: !!h.archived,
        }))}
      />

      <ExportCard />
    </div>
  );
}
