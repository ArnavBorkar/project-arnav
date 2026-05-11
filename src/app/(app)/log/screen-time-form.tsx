'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { logScreenTime } from './actions';

export function ScreenTimeForm() {
  const [ig, setIg] = React.useState('');
  const [wa, setWa] = React.useState('');
  const [total, setTotal] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ig && !wa && !total) return;
    setStatus('saving');
    await logScreenTime({
      instagramMinutes: Number(ig || 0),
      whatsappMinutes: Number(wa || 0),
      totalPhoneMinutes: Number(total || 0),
    });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screen time (paste from iOS / Digital Wellbeing)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ig-min">Instagram (m)</Label>
              <Input
                id="ig-min"
                type="number"
                inputMode="numeric"
                min="0"
                value={ig}
                onChange={(e) => setIg(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="wa-min">WhatsApp (m)</Label>
              <Input
                id="wa-min"
                type="number"
                inputMode="numeric"
                min="0"
                value={wa}
                onChange={(e) => setWa(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="total-min">Total (m)</Label>
              <Input
                id="total-min"
                type="number"
                inputMode="numeric"
                min="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button type="submit" disabled={status === 'saving'}>
            {status === 'saved' ? <><Check className="h-4 w-4" /> Logged</> : status === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
