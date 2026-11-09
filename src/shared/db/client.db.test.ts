import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type DbHandle } from "./client";
import { testDatabaseUrl, truncateAllTables } from "./testing/test-db";

describe("db factory against a real MySQL", () => {
  let handle: DbHandle;

  beforeAll(() => {
    handle = createDb(testDatabaseUrl());
  });

  afterAll(async () => {
    await handle.close();
  });

  it("connects and runs a query", async () => {
    const [rows] = await handle.db.execute(sql`select 1 as one`);
    expect((rows as unknown as Array<{ one: number }>)[0].one).toBe(1);
  });

  it("uses utf8mb4", async () => {
    const [rows] = await handle.db.execute(sql`select @@character_set_database as cs`);
    expect((rows as unknown as Array<{ cs: string }>)[0].cs).toBe("utf8mb4");
  });

  it("has applied the drizzle migrations once", async () => {
    const [rows] = await handle.db.execute(
      sql`select count(*) as n from __drizzle_migrations`,
    );
    expect(Number((rows as unknown as Array<{ n: number }>)[0].n)).toBeGreaterThanOrEqual(1);
  });

  it("truncates all domain tables without touching the migrations table", async () => {
    await truncateAllTables(handle.db);
    const [rows] = await handle.db.execute(
      sql`select count(*) as n from __drizzle_migrations`,
    );
    expect(Number((rows as unknown as Array<{ n: number }>)[0].n)).toBeGreaterThanOrEqual(1);
  });
});
