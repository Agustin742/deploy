import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { Database } from "./client";

/** The transaction handle `Database.transaction` passes to its callback. */
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Coerces a possibly missing or legacy value to a string column value ('' when absent). */
export const str = (v: unknown): string => (v == null ? "" : typeof v === "string" ? v : String(v));

/** Coerces a possibly missing or legacy value to a boolean column value. */
export const flag = (v: unknown): boolean => v === true;

/** Rows per INSERT statement: keeps statements under max_allowed_packet even with large CV/JD text. */
const CHUNK = 100;

/** Batched insert (one statement per chunk); a no-op for an empty list. */
export async function insertRows<T extends MySqlTable>(
  tx: DbTransaction,
  table: T,
  rows: Array<T["$inferInsert"]>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await tx.insert(table).values(rows.slice(i, i + CHUNK));
  }
}
