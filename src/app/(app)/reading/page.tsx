import { and, eq, gte, isNotNull, isNull, asc, desc, or } from 'drizzle-orm';
import { startOfYear, format } from 'date-fns';
import { db } from '../../../../db/client';
import { appState, books, readingSessions } from '../../../../db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { todayISO } from '@/lib/time';
import {
  AddBookDialog,
  LogPagesButton,
  AbandonBookButton,
  SetCurrentBookButton,
} from './client-bits';

export const dynamic = 'force-dynamic';

export default async function ReadingPage() {
  const [state] = await db.select().from(appState).limit(1);
  const currentBook = state?.currentBookId
    ? (await db.select().from(books).where(eq(books.id, state.currentBookId)).limit(1))[0]
    : null;

  const today = todayISO();
  const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');

  const todaySessions = await db
    .select()
    .from(readingSessions)
    .where(eq(readingSessions.date, today));
  const todayPages = todaySessions.reduce((s, r) => s + (r.pagesRead ?? 0), 0);

  const finishedThisYear = await db
    .select()
    .from(books)
    .where(and(isNotNull(books.finishedAt), gte(books.finishedAt, yearStart)))
    .orderBy(desc(books.finishedAt));

  const wishlist = await db
    .select()
    .from(books)
    .where(and(eq(books.wishlist, true), isNull(books.finishedAt)))
    .orderBy(asc(books.title));

  const inProgress = await db
    .select()
    .from(books)
    .where(
      and(
        eq(books.wishlist, false),
        eq(books.abandoned, false),
        isNull(books.finishedAt),
        // exclude current
        currentBook ? or(eq(books.id, currentBook.id)) : isNotNull(books.id)
      )
    )
    .orderBy(desc(books.id));
  const otherInProgress = inProgress.filter((b) => b.id !== currentBook?.id);

  return (
    <div className="flex flex-col gap-5 px-4 pt-5 pb-12">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reading</h1>
          <p className="text-xs text-muted-foreground">20 pages/day. ~25 books/year.</p>
        </div>
        <AddBookDialog />
      </header>

      {/* Current book */}
      <Card>
        <CardHeader>
          <CardTitle>Current book</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!currentBook ? (
            <p className="text-sm text-muted-foreground">No book selected. Pick one from your queue or add a new one.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium">{currentBook.title}</div>
                  {currentBook.author && (
                    <div className="text-xs text-muted-foreground">by {currentBook.author}</div>
                  )}
                  {currentBook.category && (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {currentBook.category}
                    </Badge>
                  )}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {currentBook.currentPage ?? 0}
                  {currentBook.totalPages ? ` / ${currentBook.totalPages}` : ''}
                </span>
              </div>
              {currentBook.totalPages && (
                <Progress
                  value={Math.min(100, ((currentBook.currentPage ?? 0) / currentBook.totalPages) * 100)}
                />
              )}
              <div className="flex items-center gap-2">
                <LogPagesButton bookId={currentBook.id} />
                <AbandonBookButton bookId={currentBook.id} />
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  today: {todayPages}p
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Other in-progress */}
      {otherInProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other in progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {otherInProgress.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm">{b.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.author ?? 'Unknown'} · {b.currentPage ?? 0}{b.totalPages ? `/${b.totalPages}` : ''}p
                  </div>
                </div>
                <SetCurrentBookButton bookId={b.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Finished this year */}
      <Card>
        <CardHeader>
          <CardTitle>Finished this year ({finishedThisYear.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {finishedThisYear.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing finished yet this year.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {finishedThisYear.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {b.title}
                    {b.author && <span className="text-muted-foreground"> · {b.author}</span>}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{String(b.finishedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle>Queue ({wishlist.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {wishlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">Pre-load 5-7 books so there&apos;s never decision fatigue.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {wishlist.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate">
                    {b.title}
                    {b.author && <span className="text-muted-foreground"> · {b.author}</span>}
                  </div>
                  <SetCurrentBookButton bookId={b.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
