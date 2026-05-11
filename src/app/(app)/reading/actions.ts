'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../../db/client';
import { books, readingSessions, appState } from '../../../../db/schema';
import { todayISO } from '@/lib/time';

const AddBookSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(120).optional(),
  category: z.enum(['business', 'technical', 'fiction', 'spiritual', 'biography']).optional(),
  totalPages: z.number().int().positive().optional(),
  setAsCurrent: z.boolean().optional(),
  wishlist: z.boolean().optional(),
});

export async function addBook(input: z.infer<typeof AddBookSchema>) {
  const parsed = AddBookSchema.parse(input);
  const today = todayISO();
  const [inserted] = await db
    .insert(books)
    .values({
      title: parsed.title,
      author: parsed.author ?? null,
      category: parsed.category ?? null,
      totalPages: parsed.totalPages ?? null,
      startedAt: parsed.wishlist ? null : today,
      wishlist: parsed.wishlist ?? false,
    })
    .returning({ id: books.id });

  if (parsed.setAsCurrent && !parsed.wishlist) {
    await db.update(appState).set({ currentBookId: inserted.id }).where(sql`${appState.id} = 1`);
  }
  revalidatePath('/reading');
}

const LogPagesSchema = z.object({
  bookId: z.number().int().positive(),
  pages: z.number().int().positive(),
});

export async function logPagesRead(input: z.infer<typeof LogPagesSchema>) {
  const parsed = LogPagesSchema.parse(input);
  await db.insert(readingSessions).values({
    bookId: parsed.bookId,
    date: todayISO(),
    pagesRead: parsed.pages,
  });
  const [book] = await db.select().from(books).where(eq(books.id, parsed.bookId)).limit(1);
  if (book) {
    const newPage = (book.currentPage ?? 0) + parsed.pages;
    await db.update(books).set({ currentPage: newPage }).where(eq(books.id, parsed.bookId));
  }
  revalidatePath('/reading');
  revalidatePath('/metrics');
}

export async function finishBook(id: number) {
  await db.update(books).set({ finishedAt: todayISO() }).where(eq(books.id, id));
  // clear current_book_id if it was this one
  const state = await db.select().from(appState).limit(1);
  if (state[0]?.currentBookId === id) {
    await db.update(appState).set({ currentBookId: null }).where(sql`${appState.id} = 1`);
  }
  revalidatePath('/reading');
}

export async function abandonBook(id: number) {
  await db.update(books).set({ abandoned: true }).where(eq(books.id, id));
  const state = await db.select().from(appState).limit(1);
  if (state[0]?.currentBookId === id) {
    await db.update(appState).set({ currentBookId: null }).where(sql`${appState.id} = 1`);
  }
  revalidatePath('/reading');
}

export async function setCurrentBook(id: number) {
  await db.update(appState).set({ currentBookId: id }).where(sql`${appState.id} = 1`);
  // clear abandoned if it was, set startedAt if null
  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  if (book) {
    await db
      .update(books)
      .set({
        abandoned: false,
        wishlist: false,
        startedAt: book.startedAt ?? todayISO(),
      })
      .where(eq(books.id, id));
  }
  revalidatePath('/reading');
}
