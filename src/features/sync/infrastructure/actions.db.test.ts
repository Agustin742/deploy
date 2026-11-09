import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { loadState, replaceState } from "@/features/state/infrastructure/state-repository";
import { blank } from "@/features/state/domain/state";
import { createDb, type DbHandle } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import { testDatabaseUrl, truncateAllTables } from "@/shared/db/testing/test-db";

// The module boundary the actions depend on: the session and the app's database pool.
const session = vi.hoisted(() => ({ current: null as null | { user: { id: string } } }));
const database = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/features/auth/infrastructure/session", () => ({ getSession: async () => session.current }));
vi.mock("@/shared/db/get-db", () => ({ getDb: () => database.current }));

import { applyCommands, loadMyState } from "./actions";

const now = new Date();
const authUser = (id: string) => ({
  id,
  name: id,
  email: `${id}@example.com`,
  emailVerified: false,
  createdAt: now,
  updatedAt: now,
});

describe("state server actions", () => {
  let handle: DbHandle;

  beforeAll(() => {
    handle = createDb(testDatabaseUrl());
    database.current = handle.db;
  });
  afterAll(async () => {
    await handle.close();
  });
  beforeEach(async () => {
    session.current = null;
    await truncateAllTables(handle.db);
    await handle.db.insert(schema.user).values([authUser("u1"), authUser("u2")]);
    await replaceState(handle.db, "u1", blank());
    await replaceState(handle.db, "u2", blank());
  });

  describe("signed out", () => {
    it("applyCommands returns unauthorized and writes nothing", async () => {
      const result = await applyCommands([{ type: "draft.setFields", fields: { empresa: "Acme" } }]);
      expect(result).toEqual({ ok: false, error: "unauthorized" });
      expect((await loadState(handle.db, "u1")).draft.empresa).toBe("");
      expect((await loadState(handle.db, "u2")).draft.empresa).toBe("");
    });

    it("loadMyState returns unauthorized", async () => {
      expect(await loadMyState()).toEqual({ ok: false, error: "unauthorized" });
    });
  });

  describe("signed in", () => {
    it("applyCommands applies to the session user only", async () => {
      session.current = { user: { id: "u1" } };
      const result = await applyCommands([{ type: "draft.setFields", fields: { empresa: "Acme" } }]);
      expect(result).toEqual({ ok: true });
      expect((await loadState(handle.db, "u1")).draft.empresa).toBe("Acme");
      expect((await loadState(handle.db, "u2")).draft.empresa).toBe("");
    });

    it("ignores a user id smuggled into the arguments", async () => {
      session.current = { user: { id: "u1" } };
      const result = await applyCommands([{ type: "draft.setFields", fields: { empresa: "Acme" }, userId: "u2" } as never]);
      // Extra keys on a command are not part of its shape; the batch is applied for the session user.
      expect(result.ok).toBe(true);
      expect((await loadState(handle.db, "u2")).draft.empresa).toBe("");
      expect((await loadState(handle.db, "u1")).draft.empresa).toBe("Acme");
    });

    it("returns invalid for a malformed batch", async () => {
      session.current = { user: { id: "u1" } };
      expect(await applyCommands([{ type: "nope" }] as never)).toEqual({ ok: false, error: "invalid" });
    });

    it("returns the typed error of a failing command and leaves the state alone", async () => {
      session.current = { user: { id: "u1" } };
      const result = await applyCommands([
        { type: "draft.setFields", fields: { empresa: "Acme" } },
        { type: "app.remove", id: "missing" },
      ]);
      expect(result).toEqual({ ok: false, error: "not_found", index: 1 });
      expect((await loadState(handle.db, "u1")).draft.empresa).toBe("");
    });

    it("loadMyState returns the session user's state", async () => {
      await handle.db.insert(schema.drafts).values({ userId: "u2", empresa: "Otra" }).onDuplicateKeyUpdate({ set: { empresa: "Otra" } });
      session.current = { user: { id: "u1" } };
      await applyCommands([{ type: "draft.setFields", fields: { empresa: "Mia" } }]);
      const result = await loadMyState();
      expect(result.ok && result.state.draft.empresa).toBe("Mia");
      session.current = { user: { id: "u2" } };
      const other = await loadMyState();
      expect(other.ok && other.state.draft.empresa).toBe("Otra");
    });
  });
});
