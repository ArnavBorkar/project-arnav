import 'dotenv/config';
import { drizzle as drizzlePg, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as pgSchema from './schema.pg';
import * as sqliteSchema from './schema.sqlite';

/**
 * App code imports `db` and uses Drizzle's fluent API.
 * Both pg and sqlite Drizzle clients expose the same `select/insert/update/delete`
 * surface, so we expose the type as the pg client (which is the production target).
 * At runtime, sqlite drizzle is structurally compatible for the queries we issue.
 */
export type AppDb = PostgresJsDatabase<typeof pgSchema>;

declare global {
  // eslint-disable-next-line no-var
  var __projectAbDb: AppDb | undefined;
}

const driver = process.env.DB_DRIVER ?? 'postgres';

function buildDb(): AppDb {
  if (driver === 'sqlite') {
    const path = process.env.SQLITE_PATH ?? './data/project-ab.sqlite';
    mkdirSync(dirname(path), { recursive: true });
    const sqlite = new Database(path);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    // Cast to the pg shape — runtime API surface is identical for our usage.
    return drizzleSqlite(sqlite, { schema: sqliteSchema }) as unknown as AppDb;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Either set it or use DB_DRIVER=sqlite.');
  }
  const client = postgres(url, { prepare: false, max: 1 });
  return drizzlePg(client, { schema: pgSchema });
}

export const db: AppDb = globalThis.__projectAbDb ?? buildDb();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__projectAbDb = db;
}

export const isSqlite = driver === 'sqlite';
