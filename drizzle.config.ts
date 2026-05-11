import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const driver = process.env.DB_DRIVER === 'sqlite' ? 'sqlite' : 'postgres';

export default {
  schema: driver === 'sqlite' ? './db/schema.sqlite.ts' : './db/schema.pg.ts',
  out: driver === 'sqlite' ? './drizzle/sqlite' : './drizzle/pg',
  dialect: driver === 'sqlite' ? 'sqlite' : 'postgresql',
  dbCredentials:
    driver === 'sqlite'
      ? { url: process.env.SQLITE_PATH ?? './data/project-ab.sqlite' }
      : { url: process.env.DATABASE_URL ?? 'postgres://arnav:arnav@localhost:5432/project_ab' },
  verbose: true,
  strict: true,
} satisfies Config;
