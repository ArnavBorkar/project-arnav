import { NextResponse } from 'next/server';
import { db } from '../../../../db/client';
import {
  appState,
  habits,
  dailyLogs,
  sleepLogs,
  gymSessions,
  exerciseSets,
  bodyMetrics,
  meals,
  people,
  books,
  readingSessions,
  financeSnapshots,
  weeklyReviews,
  quarterlyReviews,
  identityStatements,
  screenTimeLogs,
  moodLogs,
} from '../../../../db/schema';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.authenticated) return NextResponse.json({ ok: false }, { status: 401 });

  const dump = {
    exportedAt: new Date().toISOString(),
    appState: await db.select().from(appState),
    habits: await db.select().from(habits),
    dailyLogs: await db.select().from(dailyLogs),
    sleepLogs: await db.select().from(sleepLogs),
    gymSessions: await db.select().from(gymSessions),
    exerciseSets: await db.select().from(exerciseSets),
    bodyMetrics: await db.select().from(bodyMetrics),
    meals: await db.select().from(meals),
    people: await db.select().from(people),
    books: await db.select().from(books),
    readingSessions: await db.select().from(readingSessions),
    financeSnapshots: await db.select().from(financeSnapshots),
    weeklyReviews: await db.select().from(weeklyReviews),
    quarterlyReviews: await db.select().from(quarterlyReviews),
    identityStatements: await db.select().from(identityStatements),
    screenTimeLogs: await db.select().from(screenTimeLogs),
    moodLogs: await db.select().from(moodLogs),
  };

  // strip pin_hash from app_state before exporting
  if (Array.isArray(dump.appState)) {
    dump.appState = dump.appState.map(({ pinHash: _ph, ...rest }) => rest as typeof dump.appState[number]);
  }

  const filename = `project-ab-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
