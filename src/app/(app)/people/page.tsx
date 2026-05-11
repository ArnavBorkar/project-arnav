import { differenceInCalendarDays, parseISO } from 'date-fns';
import { eq, asc } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { people } from '../../../../db/schema';
import { todayISO } from '@/lib/time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddPersonDialog, MarkContactedButton } from './client-bits';

export const dynamic = 'force-dynamic';

export default async function PeoplePage() {
  const rows = await db
    .select()
    .from(people)
    .where(eq(people.archived, false))
    .orderBy(asc(people.name));

  const today = todayISO();

  const enriched = rows.map((p) => {
    const days = p.lastContactedAt
      ? differenceInCalendarDays(parseISO(today), parseISO(String(p.lastContactedAt)))
      : 365;
    const overdueBy = days - p.cadenceDays;
    return { ...p, daysSince: days, overdueBy };
  });

  enriched.sort((a, b) => b.overdueBy - a.overdueBy);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">People</h1>
          <p className="text-xs text-muted-foreground">Move from reactive to initiating.</p>
        </div>
        <AddPersonDialog />
      </header>

      {enriched.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No people added yet. Tap +Person to start.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {enriched.map((p) => (
            <Card key={p.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {p.relationship}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.lastContactedAt ? (
                      <>
                        Last contacted <span className="font-mono">{p.daysSince}d</span> ago · cadence{' '}
                        <span className="font-mono">{p.cadenceDays}d</span>
                      </>
                    ) : (
                      <>No contact logged yet · cadence {p.cadenceDays}d</>
                    )}
                  </div>
                  <div className="mt-1.5">
                    {p.overdueBy > 0 ? (
                      <Badge variant="warning">{p.overdueBy}d overdue</Badge>
                    ) : p.overdueBy === 0 ? (
                      <Badge variant="default">Due today</Badge>
                    ) : (
                      <Badge variant="success">On track</Badge>
                    )}
                  </div>
                </div>
                <MarkContactedButton id={p.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
