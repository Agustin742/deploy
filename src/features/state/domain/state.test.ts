import { describe, expect, it } from "vitest";
import { syncProfileName } from "@/features/profile/domain/name";
import type { Profile } from "./types";
import { blank, hydrate, LISTAS } from "./state";
import golden from "./__fixtures__/legacy-hydrate.json";
import sample from "./__fixtures__/sample-state.json";

// legacy-hydrate.json holds what the original artifact's blank()/hydrate()
// produced for each input (TODAY fixed to golden.today).

describe("blank", () => {
  it("matches the legacy empty state", () => {
    expect(blank()).toEqual(golden.blank);
  });

  it("returns independent copies", () => {
    const a = blank();
    a.platforms[0].name = "changed";
    a.apps.push({} as never);
    expect(blank().platforms[0].name).toBe("LinkedIn");
    expect(blank().apps).toHaveLength(0);
  });

  it("lists the collection keys", () => {
    expect(LISTAS).toEqual([
      "objetivos",
      "contactos",
      "red",
      "posts",
      "tiempos",
      "revisiones",
      "empleadores",
      "experimentos",
      "metricas",
      "descansos",
    ]);
  });
});

describe("hydrate", () => {
  golden.hydrate.forEach(({ input, output }, i) => {
    it(`matches legacy hydrate for case #${i}: ${JSON.stringify(input).slice(0, 70)}`, () => {
      expect(hydrate(input, golden.today)).toEqual(output);
    });
  });

  it("does not mutate its input", () => {
    const input = { objetivos: [{ id: "a", plazo: "2026-05-20" }], profile: { name: "Ana" } };
    const copy = JSON.parse(JSON.stringify(input));
    hydrate(input, golden.today);
    expect(input).toEqual(copy);
  });

  it("migrates objectives without a period to monthly using the deadline month", () => {
    const s = hydrate({ objetivos: [{ id: "a", plazo: "2026-05-20" }] }, golden.today);
    expect(s.objetivos[0]).toMatchObject({ periodo: "Mensual", mes: "2026-05", semana: "" });
  });

  it("marks a named profile without nameAuto as manual, except the old sample name", () => {
    expect(hydrate({ profile: { name: "Ana Perez" } }, golden.today).profile.nameAuto).toBe(false);
    expect(hydrate({ profile: { name: "Iván Gonzalez" } }, golden.today).profile.nameAuto).toBe(true);
  });

  it("resets the goal unless goalSet is true", () => {
    expect(hydrate({ goal: 5 }, golden.today).goal).toBe(0);
    expect(hydrate({ goal: 5, goalSet: true }, golden.today).goal).toBe(5);
  });

  it("drops the removed 'emociones' key", () => {
    expect("emociones" in hydrate({ emociones: [1] }, golden.today)).toBe(false);
  });

  it("round-trips a full saved state through JSON", () => {
    const full = { ...blank(), ...sample };
    const loaded = hydrate(JSON.parse(JSON.stringify(full)), golden.today);
    expect(loaded).toEqual(hydrate(full, golden.today));
    expect(loaded.apps).toHaveLength(7);
    expect(loaded.apps.every((a) => Array.isArray(a.entrevistas))).toBe(true);
  });

  it("defaults the reference date to today", () => {
    const s = hydrate({ objetivos: [{ id: "b" }] });
    expect(s.objetivos[0].mes).toMatch(/^\d{4}-\d{2}$/);
  });

  it("accepts garbage without throwing", () => {
    expect(() => hydrate(null as never)).not.toThrow();
    expect(hydrate({ apps: "bad" }).apps).toEqual([]);
  });
});

describe("profile name sync after load (legacy rule)", () => {
  golden.sync.forEach(({ input, output }, i) => {
    it(`matches legacy syncName for case #${i}`, () => {
      expect(syncProfileName(input as Profile)).toEqual(output);
    });
  });
});
