import { sql } from "drizzle-orm";
import { inject } from "vitest";
import type { Database } from "../client";

/** Connection string of the per-run MySQL container (provided by global-setup). */
export function testDatabaseUrl(): string {
  return inject("testDatabaseUrl");
}

/** Empties every table except drizzle's migrations table. Call between tests. */
export async function truncateAllTables(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    const [rows] = await tx.execute(
      sql`select table_name as name from information_schema.tables
          where table_schema = database() and table_type = 'BASE TABLE'
          and table_name <> '__drizzle_migrations'`,
    );
    await tx.execute(sql`set foreign_key_checks = 0`);
    for (const { name } of rows as unknown as Array<{ name: string }>) {
      await tx.execute(sql.raw(`truncate table \`${name}\``));
    }
    await tx.execute(sql`set foreign_key_checks = 1`);
  });
}
