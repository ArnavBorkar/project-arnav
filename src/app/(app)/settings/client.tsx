'use client';

import * as React from 'react';
import { Bell, BellOff, Trash2, Download, Smartphone, KeyRound, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  advancePhase,
  regressPhase,
  rotatePin,
  toggleHabitArchived,
  updateNotificationPrefs,
  removePushSubscription,
} from './actions';

export function PhaseCard({ currentPhase }: { currentPhase: number }) {
  const [openAdvance, setOpenAdvance] = React.useState(false);
  const [openRegress, setOpenRegress] = React.useState(false);
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPhase >= 4}
        onClick={() => setOpenAdvance(true)}
      >
        Advance to Phase {currentPhase + 1}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPhase <= 1}
        onClick={() => setOpenRegress(true)}
      >
        Drop to Phase {currentPhase - 1}
      </Button>

      <Dialog open={openAdvance} onOpenChange={setOpenAdvance}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance phase?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Unlocks more habits on Today. Are your current habits anchored? Per PROJECT_ARNAV.md §9,
            don&apos;t advance until your &quot;felt rested&quot; average ≥ 4/5 across two weeks.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenAdvance(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await advancePhase();
                setOpenAdvance(false);
              }}
            >
              Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRegress} onOpenChange={setOpenRegress}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop a phase?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Useful if you advanced too early and want to focus. Habits in higher phases
            stay logged but hide from Today.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenRegress(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await regressPhase();
                setOpenRegress(false);
              }}
            >
              Drop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PinRotationCard() {
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(current) || !/^\d{4}$/.test(next)) {
      setError('Both PINs must be 4 digits.');
      return;
    }
    setStatus('saving');
    setError(null);
    const r = await rotatePin({ currentPin: current, newPin: next });
    if (r.ok) {
      setStatus('saved');
      setCurrent('');
      setNext('');
      setTimeout(() => {
        setStatus('idle');
        setOpen(false);
      }, 1500);
    } else {
      setStatus('error');
      setError(r.reason === 'locked' ? 'Account is locked. Wait a moment.' : 'Current PIN is wrong.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-left"
      >
        <span className="flex items-center gap-3 text-sm">
          <KeyRound className="h-4 w-4 text-primary" />
          Rotate PIN
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate PIN</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="cur-pin">Current PIN</Label>
              <Input
                id="cur-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={current}
                onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ''))}
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="new-pin">New PIN</Label>
              <Input
                id="new-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={next}
                onChange={(e) => setNext(e.target.value.replace(/\D/g, ''))}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-streak-missed">{error}</p>}
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={status === 'saving'}>
                {status === 'saved' ? <><Check className="h-4 w-4" /> Done</> : status === 'saving' ? 'Saving…' : 'Rotate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NotificationsCard({
  enabled,
  quietHoursStart,
  quietHoursEnd,
}: {
  enabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}) {
  const [on, setOn] = React.useState(enabled);
  const [start, setStart] = React.useState(quietHoursStart);
  const [end, setEnd] = React.useState(quietHoursEnd);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
    (async () => {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setSubscribed(!!sub);
      }
    })();
  }, []);

  const saveQuiet = async () => {
    await updateNotificationPrefs({ enabled: on, quietHoursStart: start, quietHoursEnd: end });
    setMessage('Saved.');
    setTimeout(() => setMessage(null), 1500);
  };

  const enablePush = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setMessage('Permission denied.');
        return;
      }
      const vapidResp = await fetch('/api/push/vapid');
      const { publicKey } = await vapidResp.json();
      if (!publicKey) {
        setMessage('Server VAPID key not configured. Run `npm run vapid:generate`.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });
      const raw = sub.toJSON();
      const deviceLabel = navigator.userAgent.match(/iPhone|iPad|iPod/) ? 'iPhone' : navigator.userAgent.match(/Mac/) ? 'Mac' : 'Browser';
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: raw.keys?.p256dh,
          auth: raw.keys?.auth,
          deviceLabel,
        }),
      });
      setSubscribed(true);
      setMessage('Subscribed.');
    } catch (err) {
      console.error(err);
      setMessage('Subscribe failed.');
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/push/test', { method: 'POST' });
      const data = await r.json();
      setMessage(data.ok ? `Sent to ${data.sent} device${data.sent === 1 ? '' : 's'}.` : 'Test failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {on ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
          <Label>Send scheduled reminders</Label>
          <Switch checked={on} onCheckedChange={setOn} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="quiet-s">Quiet from</Label>
            <Input
              id="quiet-s"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="quiet-e">Quiet until</Label>
            <Input
              id="quiet-e"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <Button size="sm" onClick={saveQuiet}>Save preferences</Button>

        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            On this device: permission <span className="font-mono">{permission}</span> ·{' '}
            {subscribed ? 'subscribed' : 'not subscribed'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!subscribed && (
              <Button size="sm" onClick={enablePush} disabled={busy}>
                Enable push on this device
              </Button>
            )}
            {subscribed && (
              <Button size="sm" variant="secondary" onClick={sendTest} disabled={busy}>
                Send test push
              </Button>
            )}
          </div>
          {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function PushDevicesCard({
  devices,
}: {
  devices: Array<{ id: number; deviceLabel: string | null; createdAt: string | null }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          Push devices ({devices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices subscribed yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
                <div>
                  <div>{d.deviceLabel ?? 'Unknown device'}</div>
                  <div className="text-xs text-muted-foreground">added {d.createdAt ?? '—'}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await removePushSubscription(d.id);
                  }}
                  aria-label="Remove device"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface HabitItem {
  id: number;
  slug: string;
  name: string;
  area: string;
  cadence: string;
  phaseEnabled: number;
  archived: boolean;
}

export function HabitListCard({ habits }: { habits: HabitItem[] }) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? habits : habits.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habit catalog ({habits.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {visible.map((h) => (
          <HabitRow key={h.id} habit={h} />
        ))}
        {habits.length > 10 && (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show fewer' : `Show all ${habits.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function HabitRow({ habit }: { habit: HabitItem }) {
  const [archived, setArchived] = React.useState(habit.archived);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
      <div className="min-w-0">
        <div className={`truncate ${archived ? 'text-muted-foreground line-through' : ''}`}>
          {habit.name}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">{habit.area}</Badge>
          <Badge variant="outline" className="text-[10px]">{habit.cadence}</Badge>
          <Badge variant="outline" className="text-[10px]">P{habit.phaseEnabled}</Badge>
        </div>
      </div>
      <Switch
        checked={!archived}
        onCheckedChange={async (v) => {
          setArchived(!v);
          await toggleHabitArchived({ habitId: habit.id, archived: !v });
        }}
      />
    </div>
  );
}

export function ExportCard() {
  const onClick = () => {
    const link = document.createElement('a');
    link.href = '/api/export';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Data
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Export everything as JSON. The PIN hash is stripped before download.
        </p>
        <Button size="sm" variant="secondary" onClick={onClick}>
          Export as JSON
        </Button>
      </CardContent>
    </Card>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
