/**
 * Active schema — picks pg or sqlite tables at runtime based on DB_DRIVER.
 *
 * Both files declare structurally identical tables (same column names, same logical types).
 * For TypeScript, we expose the postgres types so app code has stable inference.
 * At runtime, when DB_DRIVER=sqlite, the actual table objects come from schema.sqlite.ts —
 * crucially so that booleans / dates / numerics encode correctly for SQLite.
 */
import * as pg from './schema.pg';
import * as sqlite from './schema.sqlite';

const driver = process.env.DB_DRIVER ?? 'postgres';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dialect-specific tables share a logical shape
const active: any = driver === 'sqlite' ? sqlite : pg;

export const appState: typeof pg.appState = active.appState;
export const habits: typeof pg.habits = active.habits;
export const dailyLogs: typeof pg.dailyLogs = active.dailyLogs;
export const sleepLogs: typeof pg.sleepLogs = active.sleepLogs;
export const gymSessions: typeof pg.gymSessions = active.gymSessions;
export const exerciseSets: typeof pg.exerciseSets = active.exerciseSets;
export const bodyMetrics: typeof pg.bodyMetrics = active.bodyMetrics;
export const meals: typeof pg.meals = active.meals;
export const people: typeof pg.people = active.people;
export const books: typeof pg.books = active.books;
export const readingSessions: typeof pg.readingSessions = active.readingSessions;
export const financeSnapshots: typeof pg.financeSnapshots = active.financeSnapshots;
export const weeklyReviews: typeof pg.weeklyReviews = active.weeklyReviews;
export const quarterlyReviews: typeof pg.quarterlyReviews = active.quarterlyReviews;
export const identityStatements: typeof pg.identityStatements = active.identityStatements;
export const pushSubscriptions: typeof pg.pushSubscriptions = active.pushSubscriptions;
export const screenTimeLogs: typeof pg.screenTimeLogs = active.screenTimeLogs;
export const moodLogs: typeof pg.moodLogs = active.moodLogs;
export const reminderLog: typeof pg.reminderLog = active.reminderLog;
