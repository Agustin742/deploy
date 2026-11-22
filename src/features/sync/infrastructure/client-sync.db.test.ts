import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addInterview, applyAppEdit, recalcAll, refreshMatchFromJd, removeApp, removeInterview } from "@/features/applications/domain/edit";
import { setCvText, setProfileField } from "@/features/cv/domain/profile-edit";
import { addPlatform, markAllToday, removePlatform, resetPlatforms, toggleCheck, updatePlatform } from "@/features/daily-search/domain/daily-search";
import { fillExample, saveDraft, setDraftField } from "@/features/new-offer/domain/draft";
import { toggleWeekVar } from "@/features/plan/domain/week-selection";
import { addItem, removeItem, setItemField } from "@/features/registries/domain/items";
import { createRegistryItem } from "@/features/registries/domain/registries";
import sample from "@/features/state/domain/__fixtures__/sample-state.json";
import type { AppState } from "@/features/state/domain/types";
import { loadState, replaceState } from "@/features/state/infrastructure/state-repository";
import { createAppStore } from "@/features/state/store/app-store";
import { createDb, type DbHandle } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import { testDatabaseUrl, truncateAllTables } from "@/shared/db/testing/test-db";

// The module boundary the actions depend on: the session and the app's database pool.
const session = vi.hoisted(() => ({ current: null as null | { user: { id: string } } }));
const database = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/features/auth/infrastructure/session", () => ({ requireAllowedSession: async () => session.current }));
vi.mock("@/shared/db/get-db", () => ({ getDb: () => database.current }));

import { applyCommands, loadMyState } from "./actions";

const TODAY = "2026-03-11";
const now = new Date();
const authUser = (id: string) => ({ id, name: id, email: `${id}@example.com`, emailVerified: false, createdAt: now, updatedAt: now });

/**
 * The client path end to end: the real store (optimistic update -> diff -> command queue) talking to the
 * real server actions and MySQL, with only the session faked. The oracle is the repository itself:
 * what the rows say after the commands must equal `loadState(replaceState(optimistic state))`.
 */
describe("client sync against MySQL", () => {
  let handle: DbHandle;

  beforeAll(() => {
    handle = createDb(testDatabaseUrl());
    database.current = handle.db;
  });
  afterAll(async () => {
    await handle.close();
  });
  beforeEach(async () => {
    await truncateAllTables(handle.db);
    await handle.db.insert(schema.user).values([authUser("me"), authUser("oracle"), authUser("other")]);
    session.current = { user: { id: "me" } };
  });

  const newStore = () =>
    createAppStore({
      ports: { loadState: loadMyState, applyCommands },
      onNotice: (message) => {
        throw new Error(`unexpected notice: ${message}`);
      },
      onUnauthorized: () => {
        throw new Error("unexpected unauthorized");
      },
      today: () => TODAY,
    });

  async function expectServerEquals(optimistic: AppState) {
    await replaceState(handle.db, "oracle", optimistic);
    const expected = await loadState(handle.db, "oracle");
    expect(await loadState(handle.db, "me")).toEqual(expected);
  }

  it("keeps the rows equal to the optimistic state through a realistic session", async () => {
    const store = newStore();
    const { update } = store.getState();
    await store.getState().load();

    // CV and profile (typing is debounced, files are immediate)
    update((s) => setCvText(s, "Zoe Lopez\nFrontend developer con React, TypeScript, HTML y CSS. Trabajo en equipo y git."), { immediate: true });
    update((s) => setProfileField(s, "english", "3"));
    update((s) => setProfileField(s, "headline", "Frontend"));
    update((s) => ({ ...s, goal: 12, goalSet: true }));
    update((s) => ({ ...s, mods: { ...s.mods, visibilidad: true, empleadores: true } }), { immediate: true });
    update((s) => ({ ...s, base: { ...s.base, activos: "React" }, marca: { ...s.marca, titular: "Dev" } }));

    // New offer -> application
    update((s) => setDraftField(s, "empresa", "Acme"));
    update(fillExample);
    update((s) => setDraftField(s, "link", "https://www.linkedin.com/jobs/1"));
    update(
      (s) => {
        const r = saveDraft(s, TODAY, () => "app-1");
        if (!r.ok) throw new Error("draft should save");
        return r.state;
      },
      { immediate: true },
    );
    update(
      (s) => {
        const r = saveDraft({ ...s, draft: { ...s.draft, empresa: "Beta", puesto: "Backend" } }, TODAY, () => "app-2");
        if (!r.ok) throw new Error("draft should save");
        return r.state;
      },
      { immediate: true },
    );

    // Application drawer
    update((s) => applyAppEdit(s, "app-1", "estado", "Entrevista"), { immediate: true });
    update((s) => applyAppEdit(s, "app-1", "comentarios", "Hablé con RRHH"));
    update((s) => applyAppEdit(s, "app-1", "ficha.industria", "Fintech"));
    update((s) => applyAppEdit(s, "app-1", "pre:cv:ok", true), { immediate: true });
    update((s) => applyAppEdit(s, "app-1", "pre:cv:txt", "revisado"));
    update((s) => applyAppEdit(s, "app-1", "jd", "Buscamos React, TypeScript y Docker"));
    update((s) => refreshMatchFromJd(s, "app-1", TODAY), { immediate: true });
    update((s) => addInterview(s, "app-1", TODAY, () => "iv-1"), { immediate: true });
    update((s) => addInterview(s, "app-1", TODAY, () => "iv-2"), { immediate: true });
    update((s) => applyAppEdit(s, "app-1", "ent:iv-1:etapa", "Técnica"));
    update((s) => removeInterview(s, "app-1", "iv-2"), { immediate: true });
    await store.getState().flush();
    await expectServerEquals(store.getState().state);

    // Registries, plan, daily search
    update((s) => addItem(s, "objetivos", { ...createRegistryItem("objetivos", TODAY), id: "obj-1" }), { immediate: true });
    update((s) => setItemField(s, "objetivos", "obj-1", "objetivo", "5 postulaciones", TODAY));
    update((s) => setItemField(s, "objetivos", "obj-1", "estado", "Hecho", TODAY), { immediate: true });
    update((s) => addItem(s, "red", { ...createRegistryItem("red", TODAY), id: "red-1" }), { immediate: true });
    update((s) => addItem(s, "red", { ...createRegistryItem("red", TODAY), id: "red-2" }), { immediate: true });
    update((s) => removeItem(s, "red", "red-1"), { immediate: true });
    update((s) => toggleWeekVar(s, "2026-03-09", "postulaciones", true).state, { immediate: true });
    update((s) => ({ ...s, metas: { ...s.metas, "k:1": "3" } }));
    update((s) => toggleCheck(s, "2026-03", s.platforms[0].id, 4), { immediate: true });
    update((s) => toggleCheck(s, "2026-03", s.platforms[0].id, 4), { immediate: true });
    update((s) => markAllToday(s, "2026-03", 11), { immediate: true });
    update(
      (s) => {
        const r = addPlatform(s, "Computrabajo", "computrabajo.com");
        return r.ok ? r.state : s;
      },
      { immediate: true },
    );
    update(
      (s) => {
        const r = updatePlatform(s, "computrabajo", "Computrabajo AR", "ar.computrabajo.com");
        return r.ok ? r.state : s;
      },
      { immediate: true },
    );
    update((s) => removePlatform(s, s.platforms[1].id), { immediate: true });
    update((s) => resetPlatforms(s).state, { immediate: true });
    update((s) => recalcAll(s, "2026-06-01").state, { immediate: true });
    update((s) => removeApp(s, "app-2"), { immediate: true });
    await store.getState().flush();
    await expectServerEquals(store.getState().state);

    // A change with no command of its own goes through state.replace
    update((s) => ({ ...s, revFreq: "semanal" }), { immediate: true });
    await store.getState().flush();
    await expectServerEquals(store.getState().state);

    // A second device sees the same thing
    const second = newStore();
    await second.getState().load();
    expect(second.getState().state).toEqual(await loadState(handle.db, "me"));
    expect(second.getState().state.apps.map((a) => a.id)).toEqual(["app-1"]);
  });

  it("round-trips a backup: import goes through the server and the reload shows what was saved", async () => {
    const store = newStore();
    await store.getState().load();
    expect(store.getState().importBackup(structuredClone(sample))).toBe(true);
    await store.getState().flush();
    await vi.waitFor(async () => expect(store.getState().state.apps).toHaveLength(7));
    await expectServerEquals(store.getState().state);
    expect(store.getState().state).toEqual(await loadState(handle.db, "me"));

    // Exporting again gives back the same data (what the backup file would contain).
    const exported = JSON.parse(JSON.stringify(store.getState().state)) as AppState;
    const again = newStore();
    await again.getState().load();
    expect(again.getState().importBackup(exported)).toBe(true);
    await again.getState().flush();
    expect(await loadState(handle.db, "me")).toEqual(store.getState().state);
  });

  it("never shows or changes another user's data", async () => {
    const store = newStore();
    await store.getState().load();
    store.getState().update((s) => ({ ...s, goal: 9, goalSet: true }), { immediate: true });
    await store.getState().flush();
    expect((await loadState(handle.db, "other")).goal).toBe(0);
    session.current = { user: { id: "other" } };
    const theirs = newStore();
    await theirs.getState().load();
    expect(theirs.getState().state.goal).toBe(0);
  });
});
