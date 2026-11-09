import "server-only";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";

/**
 * Generic Drizzle MySQL database type. Repositories depend on this, never on
 * the pool or a concrete driver, so tests can hand them a test database.
 */
export type Database = MySql2Database<Record<string, unknown>>;

export interface DbHandle {
  db: Database;
  close: () => Promise<void>;
}

/**
 * The single place where the driver (mysql2 pool + drizzle-orm/mysql2) is chosen.
 * Server-only: never import it from client components.
 */
export function createDb(databaseUrl: string): DbHandle {
  const pool = createPool({
    uri: databaseUrl,
    charset: "utf8mb4",
    connectionLimit: 10,
    waitForConnections: true,
  });
  const db = drizzle(pool, { mode: "default" });
  return { db, close: () => pool.end() };
}
