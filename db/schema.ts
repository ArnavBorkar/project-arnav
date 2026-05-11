// Re-exports the postgres schema as the canonical app schema.
// At runtime, when DB_DRIVER=sqlite, db/client.ts swaps in the sqlite schema —
// the columns are structurally identical so type inference still matches.
export * from './schema.pg';
