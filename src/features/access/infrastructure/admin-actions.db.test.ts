import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createDb, type DbHandle } from "@/shared/db/client";
import { testDatabaseUrl, truncateAllTables } from "@/shared/db/testing/test-db";

const owner = vi.hoisted(() => ({ current: null as null | { user: { email: string } } }));
const database = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/features/auth/infrastructure/session", () => ({ requireOwnerSession: async () => owner.current }));
vi.mock("@/shared/db/get-db", () => ({ getDb: () => database.current }));

import { addAllowedEmail, listAllowedEmails, removeAllowedEmail } from "./admin-actions";
import { isListed } from "./allowlist-repository";

describe("allowlist admin actions", () => {
  let handle: DbHandle;

  beforeAll(() => {
    handle = createDb(testDatabaseUrl());
    database.current = handle.db;
  });
  afterAll(async () => {
    await handle.close();
  });
  beforeEach(async () => {
    owner.current = null;
    await truncateAllTables(handle.db);
  });

  it("rejects every action for a non-owner and writes nothing", async () => {
    expect(await addAllowedEmail("ana@example.com")).toEqual({ ok: false, error: "forbidden" });
    expect(await removeAllowedEmail("ana@example.com")).toEqual({ ok: false, error: "forbidden" });
    expect(await listAllowedEmails()).toEqual({ ok: false, error: "forbidden" });
    expect(await isListed(handle.db, "ana@example.com")).toBe(false);
  });

  it("lets an owner add (normalized, idempotent), list and remove", async () => {
    owner.current = { user: { email: "Owner@Example.com" } };
    await addAllowedEmail("  Ana@Example.COM ");
    const again = await addAllowedEmail("ana@example.com");
    expect(again).toMatchObject({ ok: true });
    if (!again.ok) return;
    expect(again.emails).toHaveLength(1);
    expect(again.emails[0]).toMatchObject({ email: "ana@example.com", addedBy: "owner@example.com" });
    expect(await isListed(handle.db, "ANA@example.com")).toBe(true);

    const removed = await removeAllowedEmail("Ana@Example.com");
    expect(removed).toEqual({ ok: true, emails: [] });
  });

  it("rejects invalid emails", async () => {
    owner.current = { user: { email: "owner@example.com" } };
    expect(await addAllowedEmail("not-an-email")).toEqual({ ok: false, error: "invalid_email" });
    expect(await addAllowedEmail(42 as unknown as string)).toEqual({ ok: false, error: "invalid_email" });
  });
});
