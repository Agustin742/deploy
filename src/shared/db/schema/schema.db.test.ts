import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DbHandle } from "../client";
import { testDatabaseUrl, truncateAllTables } from "../testing/test-db";
import * as schema from "./index";

const EXPECTED_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "profiles",
  "drafts",
  "user_modules",
  "career_base",
  "personal_brand",
  "applications",
  "interviews",
  "application_checklist",
  "platforms",
  "search_checks",
  "plan_week_vars",
  "plan_targets",
  "objectives",
  "network_records",
  "posts",
  "time_logs",
  "reviews",
  "employers",
  "experiments",
  "metrics",
  "rest_days",
];

const now = new Date();
const authUser = (id: string) => ({
  id,
  name: id,
  email: `${id}@example.com`,
  emailVerified: false,
  createdAt: now,
  updatedAt: now,
});

const application = (userId: string, id: string) => ({
  userId,
  id,
  fecha: "2026-11-09",
  empresa: "Acme",
  puesto: "Dev",
});

describe("schema against a real MySQL", () => {
  let handle: DbHandle;
  const db = () => handle.db;

  beforeAll(() => {
    handle = createDb(testDatabaseUrl());
  });

  afterAll(async () => {
    await handle.close();
  });

  beforeEach(async () => {
    await truncateAllTables(handle.db);
    await db().insert(schema.user).values([authUser("u1"), authUser("u2")]);
  });

  it("creates every auth and domain table", async () => {
    const [rows] = await db().execute(
      sql`select table_name as name from information_schema.tables
          where table_schema = database() and table_type = 'BASE TABLE'`,
    );
    const names = (rows as unknown as Array<{ name: string }>).map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(EXPECTED_TABLES));
  });

  it("allows the same client id for two users but not twice for one user", async () => {
    await db().insert(schema.applications).values(application("u1", "a1"));
    await db().insert(schema.applications).values(application("u2", "a1"));
    await expect(
      db().insert(schema.applications).values(application("u1", "a1")),
    ).rejects.toThrow();
  });

  it("round-trips a json match column", async () => {
    const match = { pct: 82, comps: [{ k: "hard", w: 50, s: 0.8, d: "ok" }], yc: null };
    await db()
      .insert(schema.applications)
      .values({ ...application("u1", "a1"), match });
    const [row] = await db()
      .select({ match: schema.applications.match })
      .from(schema.applications)
      .where(and(eq(schema.applications.userId, "u1"), eq(schema.applications.id, "a1")));
    expect(row.match).toEqual(match);
  });

  it("deletes every domain row when the user is deleted", async () => {
    await db().insert(schema.applications).values(application("u1", "a1"));
    await db().insert(schema.platforms).values({ userId: "u1", id: "p1", name: "P", url: "u" });
    await db().insert(schema.profiles).values({ userId: "u1" });
    await db().insert(schema.posts).values({ userId: "u1", id: "x1", fecha: "2026-11-09" });
    await db().delete(schema.user).where(eq(schema.user.id, "u1"));
    for (const table of [
      schema.applications,
      schema.platforms,
      schema.profiles,
      schema.posts,
    ]) {
      expect(await db().select().from(table)).toHaveLength(0);
    }
  });

  it("deletes interviews and checklist items with their application only", async () => {
    await db().insert(schema.applications).values([application("u1", "a1"), application("u1", "a2")]);
    await db().insert(schema.interviews).values([
      { userId: "u1", applicationId: "a1", id: "i1" },
      { userId: "u1", applicationId: "a2", id: "i2" },
    ]);
    await db().insert(schema.applicationChecklist).values([
      { userId: "u1", applicationId: "a1", itemKey: "cv", ok: true },
      { userId: "u1", applicationId: "a2", itemKey: "cv", ok: false },
    ]);
    await db()
      .delete(schema.applications)
      .where(and(eq(schema.applications.userId, "u1"), eq(schema.applications.id, "a1")));
    expect((await db().select().from(schema.interviews)).map((r) => r.id)).toEqual(["i2"]);
    expect((await db().select().from(schema.applicationChecklist)).map((r) => r.applicationId)).toEqual(["a2"]);
  });

  it("rejects an interview whose application does not exist", async () => {
    await expect(
      db().insert(schema.interviews).values({ userId: "u1", applicationId: "nope", id: "i1" }),
    ).rejects.toThrow();
  });

  it("deletes search checks when their platform is deleted", async () => {
    await db().insert(schema.platforms).values([
      { userId: "u1", id: "p1", name: "One", url: "u" },
      { userId: "u1", id: "p2", name: "Two", url: "u" },
    ]);
    await db().insert(schema.searchChecks).values([
      { userId: "u1", month: "2026-11", platformId: "p1", day: 3 },
      { userId: "u1", month: "2026-11", platformId: "p2", day: 3 },
    ]);
    await db()
      .delete(schema.platforms)
      .where(and(eq(schema.platforms.userId, "u1"), eq(schema.platforms.id, "p1")));
    expect((await db().select().from(schema.searchChecks)).map((r) => r.platformId)).toEqual(["p2"]);
  });
});
