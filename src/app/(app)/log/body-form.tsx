'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { logBodyMetric } from './actions';

export function BodyForm() {
  const [weight, setWeight] = React.useState('');
  const [waist, setWaist] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weight);
    if (!w || w <= 0) return;
    setStatus('saving');
    await logBodyMetric({
      weightKg: w,
      waistCm: waist ? Number(waist) : null,
    });
    setStatus('saved');
    setWeight('');
    setWaist('');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bodyweight</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="body-weight">Weight (kg)</Label>
              <Input
                id="body-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="72.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="body-waist">Waist (cm, optional)</Label>
              <Input
                id="body-waist"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="82"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button type="submit" disabled={status === 'saving' || !weight}>
            {status === 'saved' ? <><Check className="h-4 w-4" /> Logged</> : status === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
