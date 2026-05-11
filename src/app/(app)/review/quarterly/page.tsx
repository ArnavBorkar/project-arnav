import { format, parseISO, addMonths } from 'date-fns';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../../../db/client';
import { quarterlyReviews } from '../../../../../db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { quarterStartOf } from '@/lib/time';
import { todayISO } from '@/lib/time';
import { submitQuarterlyReview } from './actions';

export const dynamic = 'force-dynamic';

export default async function QuarterlyReviewPage({ searchParams }: { searchParams: { q?: string } }) {
  const today = todayISO();
  const qStart = searchParams.q && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.q)
    ? quarterStartOf(searchParams.q)
    : quarterStartOf(today);

  const existing = (
    await db.select().from(quarterlyReviews).where(eq(quarterlyReviews.quarterStarting, qStart)).limit(1)
  )[0];

  const priorQuarter = quarterStartOf(format(addMonths(parseISO(qStart), -3), 'yyyy-MM-dd'));
  const prior = (
    await db.select().from(quarterlyReviews).where(eq(quarterlyReviews.quarterStarting, priorQuarter)).limit(1)
  )[0];

  const past = await db
    .select()
    .from(quarterlyReviews)
    .orderBy(desc(quarterlyReviews.quarterStarting))
    .limit(8);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Quarterly review</h1>
        <p className="text-xs text-muted-foreground">Q starting {format(parseISO(qStart), 'd MMM yyyy')}</p>
      </header>

      {prior && (
        <Card>
          <CardHeader>
            <CardTitle>Compare with last quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <ComparisonCell label="Weight" cur={existing?.weightKg} prev={prior.weightKg} unit="kg" />
              <ComparisonCell label="Waist" cur={existing?.waistCm} prev={prior.waistCm} unit="cm" />
              <ComparisonCell label="Net worth" cur={existing?.netWorth} prev={prior.netWorth} />
              <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
                Last theme:<br />
                <span className="text-foreground/85">{prior.nextQuarterTheme ?? '—'}</span>
              </div>
            </div>
            {(prior.photoFrontUrl || prior.photoSideUrl || existing?.photoFrontUrl || existing?.photoSideUrl) && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <PhotoSlot label="Then — front" url={prior.photoFrontUrl} />
                <PhotoSlot label="Now — front" url={existing?.photoFrontUrl ?? null} />
                <PhotoSlot label="Then — side" url={prior.photoSideUrl} />
                <PhotoSlot label="Now — side" url={existing?.photoSideUrl ?? null} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>This quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitQuarterlyReview} className="flex flex-col gap-4">
            <input type="hidden" name="quarterStarting" value={qStart} />

            <div className="grid grid-cols-2 gap-3">
              <PhotoField name="photoFront" label="Front photo" existing={existing?.photoFrontUrl ?? null} />
              <PhotoField name="photoSide" label="Side photo" existing={existing?.photoSideUrl ?? null} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="qr-w">Weight (kg)</Label>
                <Input
                  id="qr-w"
                  name="weightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  defaultValue={existing?.weightKg ?? ''}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="qr-waist">Waist (cm)</Label>
                <Input
                  id="qr-waist"
                  name="waistCm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  defaultValue={existing?.waistCm ?? ''}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="qr-nw">Net worth</Label>
              <Input
                id="qr-nw"
                name="netWorth"
                type="number"
                inputMode="decimal"
                defaultValue={existing?.netWorth ?? ''}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="qr-ref">Reflection</Label>
              <Textarea
                id="qr-ref"
                name="reflection"
                rows={5}
                defaultValue={existing?.reflection ?? ''}
                className="mt-1"
                placeholder="What worked? What didn't? What surprised you?"
              />
            </div>

            <div>
              <Label htmlFor="qr-theme">Next quarter theme</Label>
              <Input
                id="qr-theme"
                name="nextQuarterTheme"
                defaultValue={existing?.nextQuarterTheme ?? ''}
                className="mt-1"
                placeholder="e.g. Cardio capacity"
              />
            </div>

            <Button type="submit" size="lg">Save quarterly review</Button>
          </form>
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past quarters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {past.map((r) => (
              <a
                key={r.id}
                href={`/review/quarterly?q=${r.quarterStarting}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm hover:border-primary/40"
              >
                <span>Q starting {format(parseISO(String(r.quarterStarting)), 'd MMM yyyy')}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {r.weightKg != null ? `${r.weightKg}kg` : ''}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComparisonCell({
  label,
  cur,
  prev,
  unit,
}: {
  label: string;
  cur: string | number | null | undefined;
  prev: string | number | null | undefined;
  unit?: string;
}) {
  const curN = cur != null ? Number(cur) : null;
  const prevN = prev != null ? Number(prev) : null;
  const delta = curN != null && prevN != null ? curN - prevN : null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-base">{curN != null ? `${curN}${unit ?? ''}` : '—'}</span>
        {prevN != null && <span className="font-mono text-xs text-muted-foreground">was {prevN}</span>}
      </div>
      {delta != null && (
        <div className={`mt-0.5 font-mono text-xs ${delta === 0 ? 'text-muted-foreground' : delta > 0 ? 'text-success' : 'text-streak-missed'}`}>
          {delta > 0 ? '+' : ''}
          {Number.isInteger(delta) ? delta : delta.toFixed(1)}
        </div>
      )}
    </div>
  );
}

function PhotoSlot({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="mt-1 h-32 w-full rounded-lg object-cover" />
      ) : (
        <div className="mt-1 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          —
        </div>
      )}
    </div>
  );
}

function PhotoField({ name, label, existing }: { name: string; label: string; existing: string | null }) {
  return (
    <div>
      <Label>{label}</Label>
      {existing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={existing} alt={label} className="mt-1 mb-2 h-28 w-full rounded-lg object-cover" />
      )}
      <input
        type="file"
        name={name}
        accept="image/*"
        className="block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface-elevated file:px-3 file:py-1.5 file:text-foreground file:hover:bg-primary/20"
      />
    </div>
  );
}
