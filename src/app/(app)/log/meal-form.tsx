'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Check } from 'lucide-react';
import { logMeal } from './actions';

export function MealForm() {
  const [type, setType] = React.useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('breakfast');
  const [onTime, setOnTime] = React.useState(true);
  const [protein, setProtein] = React.useState(true);
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    await logMeal({ type, onTime, proteinHit: protein, description: description.trim() || undefined });
    setStatus('saved');
    setDescription('');
    setTimeout(() => setStatus('idle'), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="meal-type">Type</Label>
            <select
              id="meal-type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Snack</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <Label>On time</Label>
            <Switch checked={onTime} onCheckedChange={setOnTime} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <Label>Protein hit</Label>
            <Switch checked={protein} onCheckedChange={setProtein} />
          </div>

          <div>
            <Label htmlFor="meal-desc">What did you eat?</Label>
            <Textarea
              id="meal-desc"
              className="mt-1"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="3 eggs, 50g oats, banana"
            />
          </div>

          <Button type="submit" size="lg" disabled={status === 'saving'}>
            {status === 'saved' ? <><Check className="h-4 w-4" /> Logged</> : status === 'saving' ? 'Saving…' : 'Save meal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
