import { sql, type SQL } from "drizzle-orm";
import type { AnyMySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
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

/** Rows matched by an UPDATE or DELETE (mysql2 reports matched rows, not only changed ones). */
export function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  return (header as { affectedRows?: number } | undefined)?.affectedRows ?? 0;
}

/** A table with an owner and a manual order, as every ordered collection has. */
export type OrderedTable = MySqlTable & { position: AnyMySqlColumn };

/** Makes room at the top of a collection: shifts the rows matching `where` one position down. */
export async function shiftPositions(tx: DbTransaction, table: OrderedTable, where: SQL | undefined): Promise<void> {
  await tx
    .update(table)
    .set({ position: sql`${table.position} + 1` } as never)
    .where(where);
}

/** The position after the last row matching `where` (0 for an empty collection). */
export async function nextPosition(tx: DbTransaction, table: OrderedTable, where: SQL | undefined): Promise<number> {
  const [row] = await tx.select({ max: sql<number | null>`max(${table.position})` }).from(table).where(where);
  return row?.max == null ? 0 : Number(row.max) + 1;
}
