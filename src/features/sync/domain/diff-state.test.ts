import { describe, expect, it } from "vitest";
import { addInterview, applyAppEdit, recalcAll, recalcOne, removeApp, removeInterview } from "@/features/applications/domain/edit";
import { setProfileField } from "@/features/cv/domain/profile-edit";
import {
  addPlatform,
  markAllToday,
  removePlatform,
  resetPlatforms,
  toggleCheck,
  updatePlatform,
} from "@/features/daily-search/domain/daily-search";
import { clearDraft, fillExample, saveDraft, setDraftField } from "@/features/new-offer/domain/draft";
import { toggleWeekVar } from "@/features/plan/domain/week-selection";
import { createRegistryItem } from "@/features/registries/domain/registries";
import { addItem, removeItem, setItemField } from "@/features/registries/domain/items";
import sample from "@/features/state/domain/__fixtures__/sample-state.json";
import { hydrate } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import { withSyncedName } from "@/features/state/domain/with-synced-name";
import type { Command } from "./commands";
import { diffState } from "./diff-state";
import { parseCommands } from "./parse-command";

const TODAY = "2026-03-11";
const base = (): AppState => withSyncedName(hydrate(structuredClone(sample), TODAY));
const firstApp = (s: AppState) => s.apps[0];

interface Case {
  name: string;
  recipe: (s: AppState) => AppState;
  expected: Command[] | ((s: AppState) => Command[]);
}

const cases: Case[] = [
  {
    name: "profile text edit",
    recipe: (s) => setProfileField(s, "headline", "Backend"),
    expected: [{ type: "profile.setFields", fields: { headline: "Backend" } }],
  },
  {
    name: "CV edit that changes the synced name",
    recipe: (s) => setProfileField(s, "cv", "Zoe Lopez\nQA"),
    expected: [{ type: "profile.setFields", fields: { cv: "Zoe Lopez\nQA", name: "Zoe Lopez" } }],
  },
  {
    name: "goal change",
    recipe: (s) => ({ ...s, goal: 4, goalSet: true }),
    expected: [{ type: "goal.set", goal: 4, goalSet: true }],
  },
  {
    name: "direction (base) text",
    recipe: (s) => ({ ...s, base: { ...s.base, mercado: "x" } }),
    expected: [{ type: "base.setFields", fields: { mercado: "x" } }],
  },
  {
    name: "brand (marca) text",
    recipe: (s) => ({ ...s, marca: { ...s.marca, titular: "t" } }),
    expected: [{ type: "brand.setFields", fields: { titular: "t" } }],
  },
  {
    name: "module toggle",
    recipe: (s) => ({ ...s, mods: { ...s.mods, ia: !s.mods.ia } }),
    expected: (s) => [{ type: "module.set", mod: "ia", enabled: !s.mods.ia }],
  },
  {
    name: "draft field with a guessed source",
    recipe: (s) => setDraftField({ ...s, draft: { ...s.draft, fuente: "" } }, "link", "https://www.linkedin.com/jobs/1"),
    expected: [{ type: "draft.setFields", fields: { link: "https://www.linkedin.com/jobs/1", fuente: expect.any(String) } as never }],
  },
  {
    name: "draft example",
    recipe: fillExample,
    expected: [{ type: "draft.setFields", fields: { jd: expect.any(String), puesto: "Frontend Developer" } as never }],
  },
  {
    name: "app status edit",
    recipe: (s) => applyAppEdit(s, firstApp(s).id, "estado", "Oferta"),
    expected: (s) => [{ type: "app.setFields", id: firstApp(s).id, fields: { estado: "Oferta" } }],
  },
  {
    name: "app company-profile (ficha) edit",
    recipe: (s) => applyAppEdit(s, firstApp(s).id, "ficha.industria", "Rubro nuevo"),
    expected: (s) => [{ type: "app.setFields", id: firstApp(s).id, ficha: { industria: "Rubro nuevo" } }],
  },
  {
    name: "app checklist ok and text",
    recipe: (s) => applyAppEdit(applyAppEdit(s, firstApp(s).id, "pre:cv:ok", true), firstApp(s).id, "pre:cv:txt", "listo"),
    expected: (s) => [{ type: "checklist.set", appId: firstApp(s).id, key: "cv", ok: true, txt: "listo" }],
  },
  {
    name: "app removal",
    recipe: (s) => removeApp(s, firstApp(s).id),
    expected: (s) => [{ type: "app.remove", id: firstApp(s).id }],
  },
  {
    name: "new application from the draft",
    recipe: (s) => {
      const withDraft = { ...s, draft: { ...s.draft, empresa: "Acme", puesto: "Dev", jd: "x".repeat(60) } };
      const result = saveDraft(withDraft, TODAY, () => "new1");
      if (!result.ok) throw new Error("draft should save");
      return result.state;
    },
    expected: [{ type: "app.create", app: expect.objectContaining({ id: "new1", empresa: "Acme" }) as never }],
  },
  {
    name: "registry item add",
    recipe: (s) => addItem(s, "red", { ...createRegistryItem("red", TODAY), id: "x-r1" }),
    expected: [{ type: "registry.add", kind: "red", item: expect.objectContaining({ id: "x-r1" }) as never }],
  },
  {
    name: "check toggled on",
    recipe: (s) => toggleCheck(s, "2026-03", "linkedin", 5),
    expected: [{ type: "check.set", month: "2026-03", platformId: "linkedin", day: 5, checked: true }],
  },
  {
    name: "mark every platform today",
    recipe: (s) => markAllToday(s, "2026-04", 9),
    expected: [{ type: "check.markDay", month: "2026-04", day: 9 }],
  },
  {
    name: "platform added",
    recipe: (s) => {
      const r = addPlatform(s, "Computrabajo", "computrabajo.com");
      if (!r.ok) throw new Error("should add");
      return r.state;
    },
    expected: [{ type: "platform.add", platform: { id: "computrabajo", name: "Computrabajo", url: "https://computrabajo.com", custom: true } }],
  },
  {
    name: "platform renamed",
    recipe: (s) => {
      const r = updatePlatform(s, s.platforms[0].id, "Nuevo", "nuevo.com");
      if (!r.ok) throw new Error("should update");
      return r.state;
    },
    expected: (s) => [{ type: "platform.update", id: s.platforms[0].id, name: "Nuevo", url: "https://nuevo.com" }],
  },
  {
    name: "platform removed together with its checks",
    recipe: (s) => removePlatform(toggleCheck(s, "2026-03", s.platforms[0].id, 3), s.platforms[0].id),
    expected: (s) => [{ type: "platform.remove", id: s.platforms[0].id }],
  },
  {
    name: "week variables",
    recipe: (s) => {
      const r = toggleWeekVar(s, "2026-03-09", "postulaciones", true);
      return r.state;
    },
    expected: [{ type: "plan.setWeekVars", week: "2026-03-09", varIds: expect.arrayContaining(["postulaciones"]) as never }],
  },
  {
    name: "plan target",
    recipe: (s) => ({ ...s, metas: { ...s.metas, "k:1": "5" } }),
    expected: [{ type: "plan.setTarget", key: "k:1", value: "5" }],
  },
];

function withJd(s: AppState): AppState {
  const cv = "Zoe Lopez\nReact TypeScript developer";
  return {
    ...s,
    profile: { ...s.profile, cv },
    apps: s.apps.map((a, i) => (i === 0 ? { ...a, jd: "Buscamos React y TypeScript con inglés" } : a)),
  };
}

function withObjective(s: AppState): AppState {
  return addItem(s, "objetivos", { ...createRegistryItem("objetivos", TODAY), id: "x-o1" });
}

describe("diffState", () => {
  it("returns nothing when the state did not change", () => {
    const s = base();
    expect(diffState(s, s)).toEqual([]);
    expect(diffState(s, structuredClone(s))).toEqual([]);
  });

  describe("maps each domain change to its command", () => {
    it.each(cases)("$name", ({ recipe, expected }) => {
      const prev = base();
      const next = recipe(prev);
      const want = typeof expected === "function" ? expected(prev) : expected;
      expect(diffState(prev, next)).toEqual(want);
    });
  });

  it("emits commands the server accepts for every case (no unknown fields leak)", () => {
    for (const { recipe } of cases) {
      const prev = base();
      const commands = diffState(prev, recipe(prev));
      expect(parseCommands(JSON.parse(JSON.stringify(commands))), JSON.stringify(commands).slice(0, 200)).not.toBeNull();
    }
  });

  it("coalesces interview edits made after the add into the add itself", () => {
    const prev = base();
    const id = firstApp(prev).id;
    const next = applyAppEdit(addInterview(prev, id, TODAY, () => "x-i1"), id, "ent:x-i1:etapa", "RRHH");
    const [add] = diffState(prev, next) as Extract<Command, { type: "interview.add" }>[];
    expect(add.interview).toMatchObject({ id: "x-i1", etapa: "RRHH" });
  });

  it("clears the draft together with creating the application from it", () => {
    const filled = { ...base(), draft: { ...base().draft, empresa: "Acme", puesto: "Dev" } };
    const result = saveDraft(filled, TODAY, () => "new1");
    if (!result.ok) throw new Error("draft should save");
    expect(diffState(filled, result.state).map((c) => c.type)).toEqual(["draft.clear", "app.create"]);
  });

  it("sends the guessed source together with an edited link", () => {
    const prev = { ...base(), apps: base().apps.map((a, i) => (i === 0 ? { ...a, fuente: "" } : a)) };
    const id = firstApp(prev).id;
    const next = applyAppEdit(prev, id, "link", "https://www.linkedin.com/jobs/2");
    expect(diffState(prev, next)).toEqual([
      { type: "app.setFields", id, fields: { link: "https://www.linkedin.com/jobs/2", fuente: next.apps[0].fuente } },
    ]);
    expect(next.apps[0].fuente).not.toBe("");
  });

  it("keeps an objective's doneAt in step with its status", () => {
    const prev = withObjective(base());
    expect(diffState(prev, setItemField(prev, "objetivos", "x-o1", "estado", "Hecho", TODAY))).toEqual([
      { type: "registry.setFields", kind: "objetivos", id: "x-o1", fields: { estado: "Hecho", doneAt: TODAY } },
    ]);
  });

  it("removes a registry item", () => {
    const prev = withObjective(base());
    expect(diffState(prev, removeItem(prev, "objetivos", "x-o1"))).toEqual([{ type: "registry.remove", kind: "objetivos", id: "x-o1" }]);
  });

  it("clears the draft with one command", () => {
    const filled = fillExample({ ...base(), draft: { ...base().draft, empresa: "Acme" } });
    expect(diffState(filled, clearDraft(filled))).toEqual([{ type: "draft.clear" }]);
  });

  it("marks only the missing platforms when some already had the day", () => {
    const prev = toggleCheck(base(), "2026-04", base().platforms[0].id, 9);
    const commands = diffState(prev, markAllToday(prev, "2026-04", 9));
    expect(commands).toHaveLength(prev.platforms.length - 1);
    expect(commands.every((c) => c.type === "check.set")).toBe(true);
  });

  it("patches an existing interview field", () => {
    const withIv = addInterview(base(), firstApp(base()).id, TODAY, () => "x-i1");
    const id = firstApp(withIv).id;
    expect(diffState(withIv, applyAppEdit(withIv, id, "ent:x-i1:feedback", "ok"))).toEqual([
      { type: "interview.setFields", appId: id, id: "x-i1", fields: { feedback: "ok" } },
    ]);
  });

  it("removes an interview", () => {
    const withIv = addInterview(base(), firstApp(base()).id, TODAY, () => "x-i1");
    const id = firstApp(withIv).id;
    expect(diffState(withIv, removeInterview(withIv, id, "x-i1"))).toEqual([{ type: "interview.remove", appId: id, id: "x-i1" }]);
  });

  it("patches a registry item field", () => {
    const withPost = addItem(base(), "posts", { ...createRegistryItem("posts", TODAY), id: "x-p1" });
    expect(diffState(withPost, setItemField(withPost, "posts", "x-p1", "tema", "IA", TODAY))).toEqual([
      { type: "registry.setFields", kind: "posts", id: "x-p1", fields: { tema: "IA" } },
    ]);
  });

  it("restores the default platforms with one command", () => {
    const missing = { ...base(), platforms: base().platforms.slice(2) };
    expect(diffState(missing, resetPlatforms(missing).state)).toEqual([{ type: "platform.restoreDefaults" }]);
  });

  it("sends only the match patch for recalculation of every application", () => {
    const prev = withJd(base());
    const { state } = recalcAll(prev, "2026-05-01");
    const commands = diffState(prev, state);
    expect(commands.length).toBeGreaterThan(0);
    for (const c of commands) {
      expect(c.type).toBe("app.setFields");
      expect(Object.keys(c)).toEqual(expect.arrayContaining(["id", "match"]));
    }
  });

  it("creates several new items so that they end up in the same order", () => {
    const prev = base();
    const a = { ...createRegistryItem("red", TODAY), id: "ra" };
    const b = { ...createRegistryItem("red", TODAY), id: "rb" };
    const next = addItem(addItem(prev, "red", b), "red", a); // list: a, b, ...rest
    const ids = diffState(prev, next).map((c) => (c as { item: { id: string } }).item.id);
    expect(ids).toEqual(["rb", "ra"]); // the server prepends, so the first one sent ends up last
  });

  describe("falls back to state.replace when a change has no command", () => {
    const fallbacks: Array<[string, (s: AppState) => AppState]> = [
      ["revFreq", (s) => ({ ...s, revFreq: "semanal" })],
      ["contactos", (s) => ({ ...s, contactos: [{ id: "c1", nombre: "x" }] })],
      ["reordered applications", (s) => ({ ...s, apps: [...s.apps].reverse() })],
      ["a removed target", (s) => ({ ...s, metas: {} })],
      ["a removed checklist item", (s) => ({ ...s, apps: s.apps.map((a, i) => (i === 0 ? { ...a, pre: {} } : a)) })],
      ["duplicate ids", (s) => ({ ...s, apps: [...s.apps, s.apps[0]] })],
    ];
    it.each(fallbacks)("%s", (_name, recipe) => {
      const prev = { ...base(), metas: { k: "1" }, revFreq: "", apps: base().apps.map((a, i) => (i === 0 ? { ...a, pre: { cv: { ok: true } } } : a)) };
      const next = recipe(prev);
      const commands = diffState(prev, next);
      expect(commands).toHaveLength(1);
      expect(commands[0]).toMatchObject({ type: "state.replace" });
      expect((commands[0] as { state: AppState }).state).toBe(next);
    });
  });

  it("sends the new match of a single recalculated application", () => {
    const prev = withJd(base());
    const id = firstApp(prev).id;
    const next = recalcOne(prev, id, "2026-06-01");
    const commands = diffState(prev, next);
    expect(commands).toEqual([{ type: "app.setFields", id, match: next.apps[0].match }]);
  });
});
