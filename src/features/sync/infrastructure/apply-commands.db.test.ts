import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { applyAppEdit, addInterview, recalcAll, recalcOne, refreshMatchFromJd, removeApp, removeInterview } from "@/features/applications/domain/edit";
import { newApp } from "@/features/applications/domain/applications";
import { PLATS } from "@/features/applications/domain/platforms";
import { markAllToday, removePlatform, resetPlatforms, toggleCheck, addPlatform, updatePlatform } from "@/features/daily-search/domain/daily-search";
import { clearDraft, fillExample, saveDraft, setDraftField } from "@/features/new-offer/domain/draft";
import { setCvText, setProfileField } from "@/features/cv/domain/profile-edit";
import { toggleWeekVar } from "@/features/plan/domain/week-selection";
import { addItem, removeItem, setItemField } from "@/features/registries/domain/items";
import { createRegistryItem, REGISTRIES, type RegistryKey } from "@/features/registries/domain/registries";
import { hydrate } from "@/features/state/domain/state";
import sample from "@/features/state/domain/__fixtures__/sample-state.json";
import type { AppState } from "@/features/state/domain/types";
import { loadState, replaceState } from "@/features/state/infrastructure/state-repository";
import { parseGoal } from "@/features/summary/domain/goal";
import { createDb, type DbHandle } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import { testDatabaseUrl, truncateAllTables } from "@/shared/db/testing/test-db";
import type { Command } from "../domain/commands";
import { REGISTRY_KEYS } from "../domain/field-specs";
import { applyCommandBatch } from "./apply-commands";

const TODAY = "2026-11-09";
const CV = "Ana Pérez\nFrontend developer con experiencia en React, TypeScript, HTML y CSS. Trabajo en equipo y git.";
const JD = "Buscamos desarrollador con React y TypeScript, conocimientos de Docker y trabajo en equipo en un equipo remoto.";

const now = new Date();
const authUser = (id: string) => ({
  id,
  name: id,
  email: `${id}@example.com`,
  emailVerified: false,
  createdAt: now,
  updatedAt: now,
});

/** A state with something in every collection the commands touch. */
function buildFixture(): AppState {
  const s = sample as unknown as AppState;
  const state = hydrate({
    ...s,
    profile: { ...s.profile, cv: CV, nameAuto: true },
    draft: { empresa: "Nueva SA", puesto: "Dev", link: "", fuente: "", estado: "Postulado", jd: JD },
    apps: s.apps.map((a, i) =>
      i === 0
        ? {
            ...a,
            fuente: "",
            jd: JD,
            match: null,
            entrevistas: [
              { id: "i1", fecha: "2026-03-05", etapa: "RRHH" },
              { id: "i2", fecha: "2026-03-09", etapa: "Técnica" },
            ],
            pre: { quien: { ok: false, txt: "" }, formato: { ok: true, txt: "Meet" } },
          }
        : a,
    ),
    descansos: [
      { id: "d1", fecha: "2026-11-10", nota: "", cumplido: false },
      { id: "d2", fecha: "2026-11-11", nota: "x", cumplido: true },
    ],
    platforms: [...PLATS, { id: "otro-sitio", name: "Otro sitio", url: "https://otro.sitio", custom: true }],
    checks: { "2026-11": { linkedin: [3, 4], indeed: [4], "otro-sitio": [4] } },
    metas: { apps: "5" },
    planVars: { "2026-11-09": ["postulaciones"] },
  });
  return state;
}

describe("applyCommandBatch against a real MySQL", () => {
  let handle: DbHandle;
  const db = () => handle.db;
  const fixture = buildFixture();

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

  const seed = (userId = "u1", state = fixture) => replaceState(db(), userId, state);
  const load = (userId = "u1") => loadState(db(), userId);

  /**
   * The key property: applying the command to the rows gives the same state as the client's
   * optimistic result (the pure domain function) saved as a whole. `optimistic` is that result.
   */
  async function expectEquivalent(commands: Command[], optimistic: AppState, { changes = true } = {}) {
    await seed();
    const before = await load();
    expect(await applyCommandBatch(db(), "u1", commands)).toEqual({ ok: true });
    await replaceState(db(), "u2", optimistic);
    const after = await load();
    expect(after).toEqual(await load("u2"));
    if (changes) expect(after).not.toEqual(before);
  }

  describe("profile, goal, base, brand and modules", () => {
    it("profile.setFields: a typed name turns the automatic name off", async () => {
      const next = setProfileField(fixture, "name", "Otro Nombre");
      await expectEquivalent(
        [{ type: "profile.setFields", fields: { name: "Otro Nombre", nameAuto: next.profile.nameAuto } }],
        next,
      );
    });

    it("profile.setFields: a CV edit re-detects the name", async () => {
      const next = setCvText(fixture, "Marta Gómez\nDeveloper con React");
      expect(next.profile.name).toBe("Marta Gómez");
      await expectEquivalent(
        [{ type: "profile.setFields", fields: { cv: next.profile.cv, name: next.profile.name, nameAuto: next.profile.nameAuto } }],
        next,
      );
    });

    it("profile.setFields: plain text and flags", async () => {
      let next = setProfileField(fixture, "headline", "Frontend");
      next = setProfileField(next, "shareName", true);
      await expectEquivalent([{ type: "profile.setFields", fields: { headline: "Frontend", shareName: true } }], next);
    });

    it.each(["7", "0", "9999", "2.5"])("goal.set from the input %s", async (raw) => {
      const goal = parseGoal(raw);
      await expectEquivalent([{ type: "goal.set", ...goal }], { ...fixture, ...goal }, { changes: false });
    });

    it("base.setFields and brand.setFields", async () => {
      await expectEquivalent(
        [
          { type: "base.setFields", fields: { activos: "Mis activos", objetivoLaboral: "Liderar" } },
          { type: "brand.setFields", fields: { promesa: "Entrego", titular: "Dev" } },
        ],
        {
          ...fixture,
          base: { ...fixture.base, activos: "Mis activos", objetivoLaboral: "Liderar" },
          marca: { ...fixture.marca, promesa: "Entrego", titular: "Dev" },
        },
      );
    });

    it("module.set switches a module on and off", async () => {
      await expectEquivalent(
        [
          { type: "module.set", mod: "ia", enabled: true },
          { type: "module.set", mod: "marca", enabled: true },
          { type: "module.set", mod: "marca", enabled: false },
        ],
        { ...fixture, mods: { ...fixture.mods, ia: true, marca: false } },
      );
    });
  });

  describe("new offer draft", () => {
    it("draft.setFields, including the source guessed from a pasted link", async () => {
      const next = setDraftField(fixture, "link", "https://www.linkedin.com/jobs/view/1");
      expect(next.draft.fuente).toBe("LinkedIn");
      await expectEquivalent(
        [{ type: "draft.setFields", fields: { link: next.draft.link, fuente: next.draft.fuente } }],
        next,
      );
    });

    it("draft.setFields: fill example", async () => {
      const next = fillExample(fixture);
      await expectEquivalent([{ type: "draft.setFields", fields: { jd: next.draft.jd, puesto: next.draft.puesto } }], next);
    });

    it("draft.clear resets the form", async () => {
      await expectEquivalent([{ type: "draft.clear" }], clearDraft(fixture));
    });
  });

  describe("applications", () => {
    it("app.create + draft.clear saves the draft as the first application", async () => {
      const saved = saveDraft(fixture, TODAY, () => "new1");
      if (!saved.ok) throw new Error("draft should be valid");
      await expectEquivalent([{ type: "app.create", app: saved.state.apps[0] }, { type: "draft.clear" }], saved.state);
      expect((await load()).apps[0].id).toBe("new1");
    });

    it("app.create keeps interviews and the checklist of a restored application", async () => {
      const app = newApp(
        {
          id: "n2",
          entrevistas: [{ id: "x1", etapa: "A" }, { id: "x2", etapa: "B" }],
          pre: { quien: { ok: true, txt: "Marta" } },
        },
        TODAY,
      );
      await expectEquivalent([{ type: "app.create", app }], { ...fixture, apps: [app, ...fixture.apps] });
    });

    it.each([
      ["a plain field", "empresa", "Acme"],
      ["a boolean field", "revisado", false],
      ["a nested company field", "ficha.cultura", "Remota"],
    ])("app.setFields: %s", async (_name, path, value) => {
      const next = applyAppEdit(fixture, "a1", path, value);
      const command: Command = path.startsWith("ficha.")
        ? { type: "app.setFields", id: "a1", ficha: { [path.slice(6)]: value } }
        : { type: "app.setFields", id: "a1", fields: { [path]: value } };
      await expectEquivalent([command], next);
    });

    it("app.setFields: a link edit also carries the guessed source", async () => {
      const next = applyAppEdit(fixture, "a1", "link", "https://www.linkedin.com/jobs/view/9");
      const app = next.apps.find((a) => a.id === "a1")!;
      expect(app.fuente).toBe("LinkedIn");
      await expectEquivalent([{ type: "app.setFields", id: "a1", fields: { link: app.link, fuente: app.fuente } }], next);
    });

    it("app.setFields: a recalculated match", async () => {
      const next = recalcOne(fixture, "a1", TODAY);
      const match = next.apps.find((a) => a.id === "a1")!.match;
      expect(match).not.toBeNull();
      await expectEquivalent([{ type: "app.setFields", id: "a1", match }], next);
    });

    it("app.setFields: recalculating every application as one batch", async () => {
      const { state: next } = recalcAll(fixture, TODAY);
      const commands = next.apps.filter((a) => a.jd).map((a): Command => ({ type: "app.setFields", id: a.id, match: a.match }));
      await expectEquivalent(commands, next);
    });

    it("app.setFields: the match is dropped when the description is emptied", async () => {
      const edited = applyAppEdit(recalcOne(fixture, "a1", TODAY), "a1", "jd", "");
      const next = refreshMatchFromJd(edited, "a1", TODAY);
      await expectEquivalent(
        [
          { type: "app.setFields", id: "a1", fields: { jd: "" }, match: null },
        ],
        next,
      );
    });

    it("app.remove deletes the application with its interviews and checklist", async () => {
      await expectEquivalent([{ type: "app.remove", id: "a1" }], removeApp(fixture, "a1"));
      const rows = await db().select().from(schema.interviews).where(eq(schema.interviews.userId, "u1"));
      expect(rows.filter((r) => r.applicationId === "a1")).toHaveLength(0);
      const checklist = await db().select().from(schema.applicationChecklist).where(eq(schema.applicationChecklist.userId, "u1"));
      expect(checklist.filter((r) => r.applicationId === "a1")).toHaveLength(0);
    });

    it("interview.add puts the interview first", async () => {
      const next = addInterview(fixture, "a1", TODAY, () => "i3");
      const interview = next.apps.find((a) => a.id === "a1")!.entrevistas[0];
      await expectEquivalent([{ type: "interview.add", appId: "a1", interview }], next);
    });

    it("interview.setFields", async () => {
      const next = applyAppEdit(fixture, "a1", "ent:i2:feedback", "Bien");
      await expectEquivalent([{ type: "interview.setFields", appId: "a1", id: "i2", fields: { feedback: "Bien" } }], next);
    });

    it("interview.remove", async () => {
      await expectEquivalent([{ type: "interview.remove", appId: "a1", id: "i1" }], removeInterview(fixture, "a1", "i1"));
    });

    it.each([
      ["an existing item, ok", "formato", { ok: false }, "pre:formato:ok", false],
      ["an existing item, note", "formato", { txt: "Zoom" }, "pre:formato:txt", "Zoom"],
      ["a new item", "salario", { ok: true }, "pre:salario:ok", true],
      ["a new item, note first", "empresa", { txt: "Fintech" }, "pre:empresa:txt", "Fintech"],
    ])("checklist.set: %s", async (_name, key, patch, path, value) => {
      await expectEquivalent(
        [{ type: "checklist.set", appId: "a1", key, ...patch }],
        applyAppEdit(fixture, "a1", path, value),
      );
    });
  });

  describe("daily search", () => {
    it("platform.add appends a custom page", async () => {
      const r = addPlatform(fixture, "Mi sitio", "mi.sitio");
      if (!r.ok) throw new Error("should add");
      await expectEquivalent([{ type: "platform.add", platform: r.state.platforms.at(-1)! }], r.state);
    });

    it("platform.update", async () => {
      const r = updatePlatform(fixture, "linkedin", "LinkedIn Jobs", "li.com/jobs");
      if (!r.ok) throw new Error("should update");
      await expectEquivalent([{ type: "platform.update", id: "linkedin", name: "LinkedIn Jobs", url: "https://li.com/jobs" }], r.state);
    });

    it("platform.remove drops the page and its checks", async () => {
      await expectEquivalent([{ type: "platform.remove", id: "linkedin" }], removePlatform(fixture, "linkedin"));
      expect((await load()).checks["2026-11"]).not.toHaveProperty("linkedin");
    });

    it("platform.restoreDefaults brings back removed initial pages", async () => {
      const removed = removePlatform(removePlatform(fixture, "linkedin"), "indeed");
      await replaceState(db(), "u1", removed);
      expect(await applyCommandBatch(db(), "u1", [{ type: "platform.restoreDefaults" }])).toEqual({ ok: true });
      await replaceState(db(), "u2", resetPlatforms(removed).state);
      expect(await load()).toEqual(await load("u2"));
      expect((await load()).platforms.map((p) => p.id)).toEqual(resetPlatforms(removed).state.platforms.map((p) => p.id));
      expect((await load()).platforms).toHaveLength(PLATS.length + 1);
    });

    it.each([
      ["checks a new day", 20, true],
      ["unchecks a checked day", 3, false],
      ["checking an already checked day is idempotent", 3, true],
    ])("check.set %s", async (_name, day, checked) => {
      const toggled = toggleCheck(fixture, "2026-11", "linkedin", day);
      // The optimistic state only differs from the fixture when the toggle actually flips the day.
      const optimistic = checked === fixture.checks["2026-11"].linkedin.includes(day) ? fixture : toggled;
      await expectEquivalent([{ type: "check.set", month: "2026-11", platformId: "linkedin", day, checked }], optimistic, {
        changes: optimistic !== fixture,
      });
    });

    it("check.markDay checks the day on every platform", async () => {
      await expectEquivalent([{ type: "check.markDay", month: "2026-11", day: 4 }], markAllToday(fixture, "2026-11", 4));
    });
  });

  describe("plan", () => {
    it("plan.setWeekVars replaces the week's variables in order", async () => {
      const r = toggleWeekVar(fixture, "2026-11-09", "red", true);
      await expectEquivalent([{ type: "plan.setWeekVars", week: "2026-11-09", varIds: r.state.planVars["2026-11-09"] }], r.state);
    });

    it("plan.setWeekVars can empty a week and start a new one", async () => {
      await expectEquivalent(
        [
          { type: "plan.setWeekVars", week: "2026-11-09", varIds: [] },
          { type: "plan.setWeekVars", week: "2026-11-16", varIds: ["red", "postulaciones"] },
        ],
        { ...fixture, planVars: { "2026-11-09": [], "2026-11-16": ["red", "postulaciones"] } },
      );
    });

    it("plan.setTarget inserts and updates a target", async () => {
      await expectEquivalent(
        [
          { type: "plan.setTarget", key: "apps", value: "9" },
          { type: "plan.setTarget", key: "posts", value: "2" },
        ],
        { ...fixture, metas: { ...fixture.metas, apps: "9", posts: "2" } },
      );
    });
  });

  describe.each(REGISTRY_KEYS)("registry %s", (kind: RegistryKey) => {
    const existing = () => (fixture[kind] as unknown as Array<{ id: string }>)[0];

    it("registry.add puts the item first", async () => {
      const item = createRegistryItem(kind, TODAY);
      await expectEquivalent([{ type: "registry.add", kind, item } as Command], addItem(fixture, kind, item));
    });

    it("registry.setFields changes only the given fields", async () => {
      const field = REGISTRIES[kind].f.find((f) => f.t !== "c" && f.t !== "d" && f.t !== "m")!.k as string;
      const next = setItemField(fixture, kind, existing().id, field, "changed", TODAY);
      await expectEquivalent(
        [{ type: "registry.setFields", kind, id: existing().id, fields: { [field]: "changed" } } as Command],
        next,
      );
    });

    it("registry.remove", async () => {
      await expectEquivalent(
        [{ type: "registry.remove", kind, id: existing().id }],
        removeItem(fixture, kind, existing().id),
      );
    });
  });

  describe("registries with derived fields", () => {
    it("objective status Hecho carries doneAt; changing the period carries the new deadline", async () => {
      const id = fixture.objetivos[0].id;
      let next = setItemField(fixture, "objetivos", id, "estado", "Hecho", TODAY);
      next = setItemField(next, "objetivos", id, "periodo", "Mensual", TODAY);
      const o = next.objetivos.find((x) => x.id === id)!;
      expect(o.doneAt).toBe(TODAY);
      await expectEquivalent(
        [
          {
            type: "registry.setFields",
            kind: "objetivos",
            id,
            fields: { estado: "Hecho", periodo: "Mensual", doneAt: o.doneAt, plazo: o.plazo },
          },
        ],
        next,
      );
    });

    it("a boolean registry field (revisiones.aplicado)", async () => {
      const id = fixture.revisiones[0].id;
      await expectEquivalent(
        [{ type: "registry.setFields", kind: "revisiones", id, fields: { aplicado: true } }],
        setItemField(fixture, "revisiones", id, "aplicado", true, TODAY),
      );
    });
  });

  describe("state.replace", () => {
    it("replaces everything, like a backup import", async () => {
      const imported = hydrate({ apps: [{ id: "z1", empresa: "Vieja SA" }], posts: [{ id: "p9", tema: "t" }] });
      await expectEquivalent([{ type: "state.replace", state: imported }], imported);
      expect((await load()).apps.map((a) => a.id)).toEqual(["z1"]);
    });
  });

  describe("results and first use", () => {
    it("materializes the blank state for a user with no rows before applying commands", async () => {
      const result = await applyCommandBatch(db(), "u1", [{ type: "draft.setFields", fields: { empresa: "Acme" } }]);
      expect(result).toEqual({ ok: true });
      const loaded = await load();
      expect(loaded.draft.empresa).toBe("Acme");
      expect(loaded.platforms).toHaveLength(PLATS.length);
    });

    it("an empty batch is ok and writes nothing", async () => {
      expect(await applyCommandBatch(db(), "u1", [])).toEqual({ ok: true });
      expect(await db().select().from(schema.profiles)).toHaveLength(0);
    });

    it("rejects a malformed batch as invalid without writing", async () => {
      expect(await applyCommandBatch(db(), "u1", [{ type: "app.drop" }])).toEqual({ ok: false, error: "invalid" });
      expect(await applyCommandBatch(db(), "u1", "nope")).toEqual({ ok: false, error: "invalid" });
      expect(await db().select().from(schema.profiles)).toHaveLength(0);
    });

    it("an update that changes nothing is not reported as missing", async () => {
      await seed();
      expect(await applyCommandBatch(db(), "u1", [{ type: "app.setFields", id: "a1", fields: { empresa: fixture.apps[0].empresa } }])).toEqual({
        ok: true,
      });
    });

    it("reports not_found for ids the user does not have", async () => {
      await seed();
      const before = await load();
      const missing: Command[] = [
        { type: "app.setFields", id: "nope", fields: { empresa: "x" } },
        { type: "app.remove", id: "nope" },
        { type: "interview.add", appId: "nope", interview: { id: "q" } },
        { type: "interview.setFields", appId: "a1", id: "nope", fields: { etapa: "x" } },
        { type: "interview.remove", appId: "a1", id: "nope" },
        { type: "checklist.set", appId: "nope", key: "k", ok: true },
        { type: "platform.update", id: "nope", name: "x", url: "u" },
        { type: "platform.remove", id: "nope" },
        { type: "check.set", month: "2026-11", platformId: "nope", day: 1, checked: true },
        { type: "registry.setFields", kind: "posts", id: "nope", fields: { tema: "x" } },
        { type: "registry.remove", kind: "posts", id: "nope" },
      ];
      for (const command of missing) {
        expect(await applyCommandBatch(db(), "u1", [command]), command.type).toEqual({ ok: false, error: "not_found", index: 0 });
      }
      expect(await load()).toEqual(before);
    });

    it("reports conflict when creating an id that already exists", async () => {
      await seed();
      const conflicts: Command[] = [
        { type: "app.create", app: newApp({ id: "a1" }, TODAY) },
        { type: "interview.add", appId: "a1", interview: { id: "i1" } },
        { type: "platform.add", platform: { id: "linkedin", name: "x", url: "u" } },
        { type: "registry.add", kind: "posts", item: { id: fixture.posts[0].id } },
      ];
      for (const command of conflicts) {
        expect(await applyCommandBatch(db(), "u1", [command]), command.type).toEqual({ ok: false, error: "conflict", index: 0 });
      }
    });
  });

  describe("atomic batches", () => {
    it("a not_found command rolls back the commands before it", async () => {
      await seed();
      const before = await load();
      const result = await applyCommandBatch(db(), "u1", [
        { type: "app.setFields", id: "a1", fields: { empresa: "Cambiada" } },
        { type: "platform.remove", id: "linkedin" },
        { type: "app.remove", id: "nope" },
      ]);
      expect(result).toEqual({ ok: false, error: "not_found", index: 2 });
      expect(await load()).toEqual(before);
    });

    it("a database error mid-batch rolls everything back", async () => {
      await seed();
      const before = await load();
      const result = await applyCommandBatch(db(), "u1", [
        { type: "app.setFields", id: "a1", fields: { empresa: "Cambiada" } },
        { type: "app.setFields", id: "a1", fields: { puesto: "x".repeat(300) } },
      ]);
      expect(result).toEqual({ ok: false, error: "failed", index: 1 });
      expect(await load()).toEqual(before);
    });

    it("the blank state created for a first batch is rolled back with it", async () => {
      const result = await applyCommandBatch(db(), "u1", [{ type: "app.remove", id: "nope" }]);
      expect(result).toMatchObject({ ok: false, error: "not_found" });
      expect(await db().select().from(schema.profiles)).toHaveLength(0);
    });
  });

  describe("user isolation", () => {
    /** User 2 has no data; every command targets ids that exist only for user 1. */
    const objectiveId = fixture.objetivos[0].id;
    const targeting: Command[] = [
      { type: "app.setFields", id: "a1", fields: { empresa: "Hackeada" } },
      { type: "app.remove", id: "a1" },
      { type: "interview.setFields", appId: "a1", id: "i1", fields: { etapa: "x" } },
      { type: "interview.remove", appId: "a1", id: "i1" },
      { type: "interview.add", appId: "a1", interview: { id: "zz" } },
      { type: "checklist.set", appId: "a1", key: "quien", ok: true },
      // A page only user 1 has (the built-in ones exist for everybody).
      { type: "platform.update", id: "otro-sitio", name: "x", url: "u" },
      { type: "platform.remove", id: "otro-sitio" },
      { type: "registry.setFields", kind: "objetivos", id: objectiveId, fields: { objetivo: "x" } },
      { type: "registry.remove", kind: "objetivos", id: objectiveId },
    ];

    it.each(targeting.map((c, i) => [c.type, i] as const))("%s from another user changes nothing", async (_type, i) => {
      await seed();
      const before = await load();
      // User 2 has no state yet, so a blank one is created for them and the id is simply not found there.
      expect(await applyCommandBatch(db(), "u2", [targeting[i]])).toMatchObject({ ok: false, error: "not_found" });
      expect(await load()).toEqual(before);
    });

    it("a command with the same ids only touches the sender", async () => {
      await seed("u1");
      await seed("u2");
      const before = await load("u1");
      const result = await applyCommandBatch(db(), "u2", [
        { type: "app.setFields", id: "a1", fields: { empresa: "Solo u2" } },
        { type: "platform.remove", id: "linkedin" },
        { type: "registry.remove", kind: "posts", id: fixture.posts[0].id },
        { type: "plan.setTarget", key: "apps", value: "99" },
        { type: "profile.setFields", fields: { headline: "Solo u2" } },
      ]);
      expect(result).toEqual({ ok: true });
      expect(await load("u1")).toEqual(before);
      const u2 = await load("u2");
      expect(u2.apps.find((a) => a.id === "a1")!.empresa).toBe("Solo u2");
      expect(u2.profile.headline).toBe("Solo u2");
    });

    it("state.replace and check commands only touch the sender", async () => {
      await seed("u1");
      const before = await load("u1");
      await applyCommandBatch(db(), "u2", [
        { type: "check.markDay", month: "2026-11", day: 1 },
        { type: "state.replace", state: hydrate({ apps: [{ id: "only-u2" }] }) },
      ]);
      expect(await load("u1")).toEqual(before);
      expect((await load("u2")).apps.map((a) => a.id)).toEqual(["only-u2"]);
    });

    it("a client cannot choose the owner through a field", async () => {
      await seed();
      const result = await applyCommandBatch(db(), "u1", [
        { type: "app.setFields", id: "a1", fields: { userId: "u2" } as never },
      ]);
      expect(result).toEqual({ ok: false, error: "invalid" });
    });
  });
});
