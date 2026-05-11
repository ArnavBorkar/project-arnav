'use client';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { submitWeeklyReview } from './actions';

interface Props {
  weekStarting: string;
  initial: {
    q1Worked: string | null;
    q2DidntWork: string | null;
    q3StreakAtRisk: string | null;
    q4ShipTarget: string | null;
    q5CallOverdue: string | null;
  };
}

const QUESTIONS = [
  { key: 'q1Worked', label: 'What worked this week?' },
  { key: 'q2DidntWork', label: "What didn't work — and why? (root cause, not surface)" },
  { key: 'q3StreakAtRisk', label: 'Which streak is most at risk next week, and what is the protection plan?' },
  { key: 'q4ShipTarget', label: 'What one thing will I ship in startup work this coming week?' },
  { key: 'q5CallOverdue', label: "Who am I calling that I haven't called in too long?" },
] as const;

export function WeeklyReviewForm({ weekStarting, initial }: Props) {
  const [values, setValues] = React.useState({
    q1Worked: initial.q1Worked ?? '',
    q2DidntWork: initial.q2DidntWork ?? '',
    q3StreakAtRisk: initial.q3StreakAtRisk ?? '',
    q4ShipTarget: initial.q4ShipTarget ?? '',
    q5CallOverdue: initial.q5CallOverdue ?? '',
  });
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    await submitWeeklyReview({
      weekStarting,
      q1Worked: values.q1Worked.trim() || undefined,
      q2DidntWork: values.q2DidntWork.trim() || undefined,
      q3StreakAtRisk: values.q3StreakAtRisk.trim() || undefined,
      q4ShipTarget: values.q4ShipTarget.trim() || undefined,
      q5CallOverdue: values.q5CallOverdue.trim() || undefined,
    });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 1800);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Five questions</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <Label htmlFor={q.key}>{q.label}</Label>
              <Textarea
                id={q.key}
                rows={3}
                className="mt-1"
                value={values[q.key]}
                onChange={(e) => setValues({ ...values, [q.key]: e.target.value })}
              />
            </div>
          ))}
          <Button type="submit" disabled={status === 'saving'} size="lg">
            {status === 'saved' ? <><Check className="h-4 w-4" /> Saved</> : status === 'saving' ? 'Saving…' : 'Save review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
