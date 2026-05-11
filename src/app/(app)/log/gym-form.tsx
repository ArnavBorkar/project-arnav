'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Check } from 'lucide-react';
import { logGymSession } from './actions';

type Row = { exercise: string; weightKg: string; reps: string; setNumber: number };

export function GymForm({ exerciseSuggestions }: { exerciseSuggestions: string[] }) {
  const [type, setType] = React.useState<'push' | 'pull' | 'legs' | 'upper' | 'cardio' | 'custom'>('push');
  const [duration, setDuration] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [sets, setSets] = React.useState<Row[]>([{ exercise: '', weightKg: '', reps: '', setNumber: 1 }]);
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const addSet = () => {
    const last = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        exercise: last?.exercise ?? '',
        weightKg: last?.weightKg ?? '',
        reps: last?.reps ?? '',
        setNumber: (last?.setNumber ?? 0) + 1,
      },
    ]);
  };

  const removeSet = (idx: number) => setSets(sets.filter((_, i) => i !== idx));

  const updateSet = (idx: number, patch: Partial<Row>) =>
    setSets(sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sets.length === 0 || sets.some((s) => !s.exercise.trim())) return;
    setStatus('saving');
    try {
      await logGymSession({
        type,
        durationMinutes: duration ? Number(duration) : undefined,
        notes: notes.trim() || undefined,
        sets: sets.map((s) => ({
          exercise: s.exercise.trim(),
          weightKg: s.weightKg ? Number(s.weightKg) : null,
          reps: s.reps ? Number(s.reps) : null,
          setNumber: s.setNumber,
        })),
      });
      setStatus('saved');
      setSets([{ exercise: '', weightKg: '', reps: '', setNumber: 1 }]);
      setDuration('');
      setNotes('');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gym session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gym-type">Type</Label>
              <select
                id="gym-type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                <option value="push">Push</option>
                <option value="pull">Pull</option>
                <option value="legs">Legs</option>
                <option value="upper">Upper</option>
                <option value="cardio">Cardio</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <Label htmlFor="gym-duration">Duration (min)</Label>
              <Input
                id="gym-duration"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <datalist id="exercise-suggestions">
            {exerciseSuggestions.map((ex) => (
              <option key={ex} value={ex} />
            ))}
          </datalist>

          <div className="flex flex-col gap-2">
            <Label>Sets</Label>
            {sets.map((s, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] gap-2">
                <Input
                  list="exercise-suggestions"
                  placeholder="Exercise"
                  value={s.exercise}
                  onChange={(e) => updateSet(idx, { exercise: e.target.value })}
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  placeholder="kg"
                  value={s.weightKg}
                  onChange={(e) => updateSet(idx, { weightKg: e.target.value })}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="reps"
                  value={s.reps}
                  onChange={(e) => updateSet(idx, { reps: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeSet(idx)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Remove set"
                  disabled={sets.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={addSet} className="self-start">
              <Plus className="h-4 w-4" /> Add set
            </Button>
          </div>

          <div>
            <Label htmlFor="gym-notes">Notes</Label>
            <Textarea
              id="gym-notes"
              className="mt-1"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel?"
            />
          </div>

          <Button type="submit" disabled={status === 'saving'} size="lg">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? <><Check className="h-4 w-4" /> Logged</> : 'Save session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
