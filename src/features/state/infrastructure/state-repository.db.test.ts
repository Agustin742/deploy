import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DbHandle } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import { testDatabaseUrl, truncateAllTables } from "@/shared/db/testing/test-db";
import { blank, hydrate } from "../domain/state";
import sample from "../domain/__fixtures__/sample-state.json";
import golden from "../domain/__fixtures__/legacy-hydrate.json";
import type { AppState } from "../domain/types";
import { withSyncedName } from "../domain/with-synced-name";
import { loadState, replaceState } from "./state-repository";

const now = new Date();
const authUser = (id: string) => ({
  id,
  name: id,
  email: `${id}@example.com`,
  emailVerified: false,
  createdAt: now,
  updatedAt: now,
});

/** What the localStorage path would load for this state, minus what the DB deliberately drops. */
function expectedLoad(input: AppState): AppState {
  const state = hydrate(input);
  const platformIds = new Set(state.platforms.map((p) => p.id));
  const checks: AppState["checks"] = {};
  for (const [month, byPlatform] of Object.entries(state.checks)) {
    for (const [pid, days] of Object.entries(byPlatform)) {
      if (!platformIds.has(pid)) continue;
      (checks[month] ??= {})[pid] = [...new Set(days)].sort((a, b) => a - b);
    }
  }
  const full = hydrate({ ...state, contactos: [], checks });
  // Keys that are not part of AppState (old backups) are not persisted.
  const known = Object.keys(blank());
  const kept = Object.fromEntries(Object.entries(full).filter(([k]) => known.includes(k)));
  return withSyncedName(kept as unknown as AppState);
}

const fixtures: Array<[string, AppState]> = [
  ["sample state", sample as unknown as AppState],
  ["blank state", blank()],
  ...golden.hydrate.map(({ output }, i): [string, AppState] => [
    `legacy hydrate output #${i}`,
    output as unknown as AppState,
  ]),
];

describe("state repository against a real MySQL", () => {
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

  it("loads the blank hydrated state for a user without rows", async () => {
    expect(await loadState(db(), "u1")).toEqual(withSyncedName(hydrate({})));
  });

  describe.each(fixtures)("round-trip: %s", (_name, state) => {
    it("loads what was replaced", async () => {
      await replaceState(db(), "u1", state);
      const loaded = await loadState(db(), "u1");
      const expected = expectedLoad(state);
      // Legacy fixtures are sparse (missing optional fields load as defaults), so compare as a subset...
      expect(loaded).toMatchObject(expected);
      // ...and require a second pass to be stable.
      await replaceState(db(), "u1", loaded);
      expect(await loadState(db(), "u1")).toEqual(loaded);
    });
  });

  it("loads a complete state exactly", async () => {
    const complete = hydrate({
      ...(sample as unknown as AppState),
      apps: (sample as unknown as AppState).apps.map((a) => ({
        ...a,
        entrevistas: [],
        pre: { quien: { ok: true, txt: "Marta" } },
      })),
    });
    await replaceState(db(), "u1", complete);
    expect(await loadState(db(), "u1")).toEqual(expectedLoad(complete));
  });

  it("keeps collection order", async () => {
    const state = hydrate({
      apps: [{ id: "b" }, { id: "a" }, { id: "c" }],
      posts: [{ id: "z" }, { id: "y" }],
      platforms: [
        { id: "two", name: "Two", url: "u" },
        { id: "one", name: "One", url: "u" },
      ],
      planVars: { "2026-11-02": ["x", "a", "m"] },
    });
    await replaceState(db(), "u1", state);
    const loaded = await loadState(db(), "u1");
    expect(loaded.apps.map((a) => a.id)).toEqual(["b", "a", "c"]);
    expect(loaded.posts.map((p) => p.id)).toEqual(["z", "y"]);
    expect(loaded.platforms.map((p) => p.id)).toEqual(["two", "one"]);
    expect(loaded.planVars["2026-11-02"]).toEqual(["x", "a", "m"]);
  });

  it("keeps a platform list the user emptied instead of restoring the defaults", async () => {
    await replaceState(db(), "u1", { ...blank(), platforms: [] });
    expect((await loadState(db(), "u1")).platforms).toEqual([]);
  });

  it("maps pre to checklist rows, metas to targets and drops contactos", async () => {
    const state = hydrate({
      apps: [{ id: "a1", pre: { quien: { ok: true, txt: "Marta" } } }],
      metas: { apps: "5" },
      contactos: [{ id: "c1", nombre: "X" }],
    });
    await replaceState(db(), "u1", state);
    expect(await db().select().from(schema.applicationChecklist)).toHaveLength(1);
    expect(await db().select().from(schema.planTargets)).toHaveLength(1);
    const loaded = await loadState(db(), "u1");
    expect(loaded.apps[0].pre).toEqual({ quien: { ok: true, txt: "Marta" } });
    expect(loaded.metas).toEqual({ apps: "5" });
    expect(loaded.contactos).toEqual([]);
  });

  it("coerces missing legacy fields to empty values", async () => {
    const state = hydrate({ apps: [{ id: "a1", entrevistas: [{ id: "i1" }] }] });
    await replaceState(db(), "u1", state);
    const loaded = await loadState(db(), "u1");
    expect(loaded.apps[0].empresa).toBe("");
    expect(loaded.apps[0].ficha.industria).toBe("");
    expect(loaded.apps[0].entrevistas[0]).toMatchObject({ id: "i1", etapa: "", preguntas: "" });
  });

  it("drops search checks whose platform no longer exists", async () => {
    const state = hydrate({
      platforms: [{ id: "p1", name: "One", url: "u" }],
      checks: { "2026-11": { p1: [3, 1], gone: [2] }, "2026-10": { gone: [5] } },
    });
    await replaceState(db(), "u1", state);
    const loaded = await loadState(db(), "u1");
    expect(loaded.checks).toEqual({ "2026-11": { p1: [1, 3] } });
  });

  it("replaces fully: a smaller second state leaves nothing behind", async () => {
    await replaceState(db(), "u1", sample as unknown as AppState);
    const small = hydrate({ apps: [{ id: "only" }], posts: [] });
    await replaceState(db(), "u1", small);
    const loaded = await loadState(db(), "u1");
    expect(loaded.apps.map((a) => a.id)).toEqual(["only"]);
    expect(loaded.posts).toEqual([]);
    expect(loaded.red).toEqual([]);
    expect(await db().select().from(schema.interviews)).toHaveLength(0);
    expect(loaded).toMatchObject(expectedLoad(small));
  });

  it("never touches another user's rows", async () => {
    const a = hydrate({ apps: [{ id: "a1", empresa: "Mine" }], posts: [{ id: "p1" }] });
    const b = hydrate({ apps: [{ id: "a1", empresa: "Theirs" }], posts: [{ id: "p1" }] });
    await replaceState(db(), "u1", a);
    await replaceState(db(), "u2", b);
    const beforeU2 = await loadState(db(), "u2");
    await replaceState(db(), "u1", hydrate({ apps: [] }));
    expect(await loadState(db(), "u2")).toEqual(beforeU2);
    expect((await loadState(db(), "u2")).apps[0].empresa).toBe("Theirs");
    expect((await loadState(db(), "u1")).apps).toEqual([]);
    expect(
      await db().select().from(schema.applications).where(eq(schema.applications.userId, "u2")),
    ).toHaveLength(1);
  });

  it("keeps the previous state when an insert fails mid-way", async () => {
    const good = hydrate({ apps: [{ id: "keep", empresa: "Keep" }], posts: [{ id: "p1" }] });
    await replaceState(db(), "u1", good);
    const before = await loadState(db(), "u1");
    // Posts are written after applications, so the failure lands mid-transaction.
    const bad = hydrate({
      apps: [{ id: "new", empresa: "New" }],
      posts: [{ id: "p2", tipo: "x".repeat(300) }],
    });
    await expect(replaceState(db(), "u1", bad)).rejects.toThrow();
    expect(await loadState(db(), "u1")).toEqual(before);
  });
});
