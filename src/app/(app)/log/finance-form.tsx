'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Lock } from 'lucide-react';
import { logFinanceSnapshot } from './actions';

export function FinanceForm({ enabled, todayISO }: { enabled: boolean; todayISO: string }) {
  const firstOfMonth = todayISO.slice(0, 7) + '-01';
  const [netWorth, setNetWorth] = React.useState('');
  const [spend, setSpend] = React.useState('');
  const [savingsRate, setSavingsRate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netWorth || !spend || !savingsRate) return;
    setStatus('saving');
    await logFinanceSnapshot({
      month: firstOfMonth,
      netWorth: Number(netWorth),
      monthlySpend: Number(spend),
      savingsRate: Number(savingsRate) / 100,
      notes: notes.trim() || undefined,
    });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Finance snapshot
          {!enabled && <Lock className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!enabled ? (
          <p className="text-sm text-muted-foreground">
            Available the first week of each month. Add <code>?force=1</code> to the URL if you need it earlier.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Snapshot for {firstOfMonth}.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="net-worth">Net worth</Label>
                <Input
                  id="net-worth"
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 1500000"
                  value={netWorth}
                  onChange={(e) => setNetWorth(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="monthly-spend">Monthly spend</Label>
                <Input
                  id="monthly-spend"
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 50000"
                  value={spend}
                  onChange={(e) => setSpend(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="savings-rate">Savings rate (%)</Label>
              <Input
                id="savings-rate"
                type="number"
                inputMode="decimal"
                placeholder="40"
                min="0"
                max="100"
                value={savingsRate}
                onChange={(e) => setSavingsRate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="finance-notes">Notes</Label>
              <Textarea
                id="finance-notes"
                rows={2}
                className="mt-1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Top 3 spend categories, investment moves, etc."
              />
            </div>
            <Button type="submit" disabled={status === 'saving' || !netWorth || !spend || !savingsRate}>
              {status === 'saved' ? <><Check className="h-4 w-4" /> Logged</> : status === 'saving' ? 'Saving…' : 'Save snapshot'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
