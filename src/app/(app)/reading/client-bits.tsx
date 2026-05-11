'use client';
import * as React from 'react';
import { Plus, BookOpen, Check, Trash2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { addBook, logPagesRead, abandonBook, setCurrentBook } from './actions';

export function AddBookDialog() {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [category, setCategory] = React.useState<'business' | 'technical' | 'fiction' | 'spiritual' | 'biography' | ''>('');
  const [totalPages, setTotalPages] = React.useState('');
  const [setCurrent, setSetCurrent] = React.useState(false);
  const [wishlist, setWishlist] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addBook({
      title: title.trim(),
      author: author.trim() || undefined,
      category: category || undefined,
      totalPages: totalPages ? Number(totalPages) : undefined,
      setAsCurrent: setCurrent,
      wishlist,
    });
    setOpen(false);
    setTitle('');
    setAuthor('');
    setTotalPages('');
    setSetCurrent(false);
    setWishlist(false);
    setCategory('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Plus className="h-4 w-4" /> Book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="b-title">Title</Label>
            <Input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" autoFocus required />
          </div>
          <div>
            <Label htmlFor="b-author">Author</Label>
            <Input id="b-author" value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="b-cat">Category</Label>
              <select
                id="b-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                <option value="">—</option>
                <option value="business">Business</option>
                <option value="technical">Technical</option>
                <option value="fiction">Fiction</option>
                <option value="spiritual">Spiritual</option>
                <option value="biography">Biography</option>
              </select>
            </div>
            <div>
              <Label htmlFor="b-pages">Total pages</Label>
              <Input
                id="b-pages"
                type="number"
                inputMode="numeric"
                min="0"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <Label>Add to queue (wishlist)</Label>
            <Switch
              checked={wishlist}
              onCheckedChange={(v) => {
                setWishlist(v);
                if (v) setSetCurrent(false);
              }}
            />
          </div>
          {!wishlist && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <Label>Set as current</Label>
              <Switch checked={setCurrent} onCheckedChange={setSetCurrent} />
            </div>
          )}
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

export function LogPagesButton({ bookId }: { bookId: number }) {
  const [pages, setPages] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const quick = async (n: number) => {
    await logPagesRead({ bookId, pages: n });
    if (typeof navigator !== 'undefined') navigator.vibrate?.(15);
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <BookOpen className="h-4 w-4" /> Log pages
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log pages</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 20].map((n) => (
              <Button
                key={n}
                variant="secondary"
                onClick={async () => {
                  await quick(n);
                  setOpen(false);
                }}
              >
                +{n}
              </Button>
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!pages) return;
              await logPagesRead({ bookId, pages: Number(pages) });
              setPages('');
              setOpen(false);
            }}
            className="flex gap-2"
          >
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              placeholder="custom"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
            />
            <Button type="submit">
              <Check className="h-4 w-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AbandonBookButton({ bookId }: { bookId: number }) {
  const [confirming, setConfirming] = React.useState(false);
  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        <Trash2 className="h-4 w-4" /> Abandon
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="destructive"
        onClick={async () => {
          await abandonBook(bookId);
          setConfirming(false);
        }}
      >
        Confirm
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}

export function SetCurrentBookButton({ bookId }: { bookId: number }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        await setCurrentBook(bookId);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <><Check className="h-4 w-4" /> Set</> : 'Read next'}
    </Button>
  );
}
