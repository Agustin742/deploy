import "server-only";
import { createDb, type Database, type DbHandle } from "./client";
import { readDatabaseUrl } from "./env";

/** Kept on globalThis so dev hot reloads reuse the pool instead of opening a new one per reload. */
const globalForDb = globalThis as unknown as { __appDb?: DbHandle };

/**
 * The app's single connection pool, opened on first use so `next build` needs no DATABASE_URL.
 * Auth and the server actions share it (the hosting plan limits open connections).
 */
export function getDb(): Database {
  globalForDb.__appDb ??= createDb(readDatabaseUrl());
  return globalForDb.__appDb.db;
}
