import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const driver = process.env.DB_DRIVER ?? 'postgres';

async function run() {
  if (driver === 'sqlite') {
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
    const Database = (await import('better-sqlite3')).default;
    const path = process.env.SQLITE_PATH ?? './data/project-ab.sqlite';
    mkdirSync(dirname(path), { recursive: true });
    const sqlite = new Database(path);
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: './drizzle/sqlite' });
    console.log('SQLite migrations applied.');
    sqlite.close();
    return;
  }

  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');
  const postgres = (await import('postgres')).default;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './drizzle/pg' });
  console.log('Postgres migrations applied.');
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
