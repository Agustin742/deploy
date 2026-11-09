import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import { newApp } from "@/features/applications/domain/applications";
import { MAX_BATCH, parseCommand, parseCommands } from "./parse-command";

const app = newApp({ id: "a1", entrevistas: [{ id: "i1", etapa: "RRHH" }], pre: { quien: { ok: true, txt: "x" } } }, "2026-11-09");

/** One valid example of every command type. */
const valid: Record<string, unknown> = {
  "profile.setFields": { type: "profile.setFields", fields: { name: "Ana", nameAuto: false, cv: "cv" } },
  "goal.set": { type: "goal.set", goal: 5, goalSet: true },
  "base.setFields": { type: "base.setFields", fields: { activos: "a", objetivoLaboral: "o" } },
  "brand.setFields": { type: "brand.setFields", fields: { promesa: "p", titular: "t" } },
  "module.set": { type: "module.set", mod: "ia", enabled: true },
  "draft.setFields": { type: "draft.setFields", fields: { empresa: "Acme", jd: "jd" } },
  "draft.clear": { type: "draft.clear" },
  "app.create": { type: "app.create", app },
  "app.setFields": {
    type: "app.setFields",
    id: "a1",
    fields: { empresa: "Acme", revisado: true },
    ficha: { industria: "Fintech" },
    match: { pct: 50, comps: [] },
  },
  "app.remove": { type: "app.remove", id: "a1" },
  "interview.add": { type: "interview.add", appId: "a1", interview: { id: "i2", fecha: "2026-11-09" } },
  "interview.setFields": { type: "interview.setFields", appId: "a1", id: "i1", fields: { etapa: "Técnica" } },
  "interview.remove": { type: "interview.remove", appId: "a1", id: "i1" },
  "checklist.set": { type: "checklist.set", appId: "a1", key: "quien", ok: true, txt: "Marta" },
  "platform.add": { type: "platform.add", platform: { id: "mi-sitio", name: "Mi sitio", url: "https://x.com", custom: true } },
  "platform.update": { type: "platform.update", id: "linkedin", name: "LinkedIn", url: "https://l.com" },
  "platform.remove": { type: "platform.remove", id: "linkedin" },
  "platform.restoreDefaults": { type: "platform.restoreDefaults" },
  "check.set": { type: "check.set", month: "2026-11", platformId: "linkedin", day: 9, checked: true },
  "check.markDay": { type: "check.markDay", month: "2026-11", day: 9 },
  "plan.setWeekVars": { type: "plan.setWeekVars", week: "2026-11-09", varIds: ["postulaciones", "red"] },
  "plan.setTarget": { type: "plan.setTarget", key: "apps", value: "5" },
  "registry.add": { type: "registry.add", kind: "objetivos", item: { id: "o1", periodo: "Semanal", objetivo: "x" } },
  "registry.setFields": { type: "registry.setFields", kind: "revisiones", id: "r1", fields: { aplicado: true, hice: "x" } },
  "registry.remove": { type: "registry.remove", kind: "posts", id: "p1" },
  "state.replace": { type: "state.replace", state: blank() },
};

describe("parseCommand", () => {
  it.each(Object.entries(valid))("accepts a valid %s", (_type, command) => {
    expect(parseCommand(command)).toEqual(command);
  });

  it("accepts every registry kind", () => {
    for (const kind of ["objetivos", "red", "posts", "metricas", "tiempos", "revisiones", "empleadores", "experimentos", "descansos"]) {
      expect(parseCommand({ type: "registry.remove", kind, id: "x" })).not.toBeNull();
    }
  });

  it.each([
    ["not an object", "nope"],
    ["null", null],
    ["an array", []],
    ["no type", {}],
    ["an unknown type", { type: "app.drop" }],
    ["an inherited type name", { type: "toString" }],
    ["a non-string type", { type: 3 }],
  ])("rejects %s", (_name, input) => {
    expect(parseCommand(input)).toBeNull();
  });

  it.each([
    ["an unknown profile field", { type: "profile.setFields", fields: { admin: true } }],
    ["a prototype key", JSON.parse('{"type":"profile.setFields","fields":{"__proto__":"x","name":"a"}}')],
    ["a SQL-looking field name", { type: "app.setFields", id: "a", fields: { "empresa = 'x' --": "y" } }],
    ["the id as a patched field", { type: "app.setFields", id: "a", fields: { id: "b" } }],
    ["the owner column as a field", { type: "registry.setFields", kind: "posts", id: "p", fields: { userId: "u2" } }],
    ["the position column as a field", { type: "registry.setFields", kind: "posts", id: "p", fields: { position: "1" } }],
    ["an empty patch", { type: "profile.setFields", fields: {} }],
    ["a missing patch", { type: "profile.setFields" }],
    ["a boolean in a text field", { type: "profile.setFields", fields: { name: true } }],
    ["a string in a boolean field", { type: "profile.setFields", fields: { nameAuto: "yes" } }],
    ["an undefined patch value", { type: "profile.setFields", fields: { name: undefined } }],
    ["an unknown registry kind", { type: "registry.remove", kind: "users", id: "x" }],
    ["an inherited registry kind", { type: "registry.remove", kind: "constructor", id: "x" }],
    ["a registry field of another registry", { type: "registry.setFields", kind: "posts", id: "p", fields: { objetivo: "x" } }],
    ["an unknown module", { type: "module.set", mod: "admin", enabled: true }],
    ["a non-boolean module flag", { type: "module.set", mod: "ia", enabled: 1 }],
    ["an empty id", { type: "app.remove", id: "" }],
    ["an id longer than the column", { type: "app.remove", id: "x".repeat(65) }],
    ["a numeric id", { type: "app.remove", id: 7 }],
    ["a malformed month", { type: "check.markDay", month: "2026-1", day: 3 }],
    ["a day out of range", { type: "check.set", month: "2026-11", platformId: "p", day: 32, checked: true }],
    ["a fractional day", { type: "check.set", month: "2026-11", platformId: "p", day: 1.5, checked: true }],
    ["a malformed week", { type: "plan.setWeekVars", week: "2026-11", varIds: [] }],
    ["non-string variable ids", { type: "plan.setWeekVars", week: "2026-11-09", varIds: [1] }],
    ["a blank platform name", { type: "platform.update", id: "x", name: "  ", url: "u" }],
    ["a checklist command that sets nothing", { type: "checklist.set", appId: "a", key: "k" }],
    ["a checklist key that is too long", { type: "checklist.set", appId: "a", key: "k".repeat(129), ok: true }],
    ["a non-finite goal", { type: "goal.set", goal: Number.NaN, goalSet: true }],
    ["a match that is not an object", { type: "app.setFields", id: "a", match: "x" }],
    ["a match without a score", { type: "app.setFields", id: "a", match: { comps: [] } }],
    ["an app with an unknown key", { type: "app.create", app: { ...app, isAdmin: true } }],
    ["an app without an id", { type: "app.create", app: { ...app, id: undefined } }],
    ["an app with a non-array interview list", { type: "app.create", app: { ...app, entrevistas: "x" } }],
    ["an interview with an unknown key", { type: "interview.add", appId: "a", interview: { id: "i", evil: "x" } }],
    ["a state that is not an object", { type: "state.replace", state: [] }],
    ["a state whose list holds a non-object", { type: "state.replace", state: { apps: [null] } }],
    ["a state whose list item has no id", { type: "state.replace", state: { posts: [{ tema: "x" }] } }],
    ["a state whose list is not an array", { type: "state.replace", state: { apps: {} } }],
  ])("rejects %s", (_name, input) => {
    expect(parseCommand(input)).toBeNull();
  });

  it("does not mutate or alias the input", () => {
    const input = { type: "profile.setFields", fields: { name: "Ana" } };
    const parsed = parseCommand(input);
    expect(parsed).toEqual(input);
    expect(parsed).not.toBe(input);
  });
});

describe("parseCommands", () => {
  it("accepts a batch and keeps its order", () => {
    const batch = [valid["draft.clear"], valid["goal.set"]];
    expect(parseCommands(batch)).toEqual(batch);
  });

  it("accepts an empty batch", () => {
    expect(parseCommands([])).toEqual([]);
  });

  it("rejects a batch with one bad command", () => {
    expect(parseCommands([valid["draft.clear"], { type: "nope" }])).toBeNull();
  });

  it("rejects non-arrays and oversized batches", () => {
    expect(parseCommands({})).toBeNull();
    expect(parseCommands(new Array(MAX_BATCH + 1).fill(valid["draft.clear"]))).toBeNull();
  });
});
