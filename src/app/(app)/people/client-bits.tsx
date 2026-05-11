'use client';
import * as React from 'react';
import { Plus, PhoneOutgoing, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addPerson, markContacted } from './actions';

const RELATIONSHIPS = ['parent', 'sibling', 'grandparent', 'family', 'friend'] as const;

export function AddPersonDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [relationship, setRelationship] = React.useState<(typeof RELATIONSHIPS)[number]>('friend');
  const [cadence, setCadence] = React.useState('14');
  const [birthday, setBirthday] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addPerson({
      name: name.trim(),
      relationship,
      cadenceDays: Number(cadence),
      birthday: birthday || null,
    });
    setOpen(false);
    setName('');
    setBirthday('');
    setRelationship('friend');
    setCadence('14');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="h-4 w-4" /> Person
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a person</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="p-rel">Relationship</Label>
            <select
              id="p-rel"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as typeof relationship)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="p-cad">Cadence (days)</Label>
            <Input
              id="p-cad"
              type="number"
              inputMode="numeric"
              min="1"
              max="365"
              value={cadence}
              onChange={(e) => setCadence(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Parents 1, family 7, friends 14 — adjust to taste.
            </p>
          </div>
          <div>
            <Label htmlFor="p-bday">Birthday (optional)</Label>
            <Input
              id="p-bday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarkContactedButton({ id }: { id: number }) {
  const [done, setDone] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await markContacted(id);
        setDone(true);
        if (typeof navigator !== 'undefined') navigator.vibrate?.(15);
        setPending(false);
        setTimeout(() => setDone(false), 1500);
      }}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated text-primary transition-transform active:scale-95"
      aria-label="Mark as contacted today"
    >
      {done ? <Check className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
    </button>
  );
}
