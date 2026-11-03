import { describe, expect, it } from "vitest";
import { newApp } from "@/features/applications/domain/applications";
import type { Application, MatchSuccess } from "@/features/state/domain/types";
import { analyze } from "./analysis";

const match = (patch: Partial<MatchSuccess>): MatchSuccess => ({
  pct: 50,
  comps: [],
  hardM: [],
  hardX: [],
  softM: [],
  softX: [],
  kwX: [],
  eng: { req: 0, cv: 0, status: "No requerido" },
  yr: null,
  yc: null,
  cumple: "Parcial",
  at: "2026-11-03",
  ...patch,
});

const app = (id: string, m: MatchSuccess | null): Application => newApp({ id, match: m }, "2026-11-03");

describe("analyze", () => {
  it("returns null when no application has a computed match, counting those without description", () => {
    expect(analyze([])).toBeNull();
    const none = analyze([app("a", null)]);
    expect(none).toBeNull();
  });

  it("counts offers with and without a match", () => {
    const r = analyze([app("a", match({})), app("b", null), app("c", match({}))]);
    expect(r?.analyzed).toBe(2);
    expect(r?.withoutMatch).toBe(1);
  });

  it("summarises the English requirement", () => {
    const r = analyze([
      app("a", match({ eng: { req: 3, cv: 3, status: "Cumple" } })),
      app("b", match({ eng: { req: 2, cv: 0, status: "No cumple" } })),
      app("c", match({ eng: { req: 3, cv: 1, status: "Parcial" } })),
      app("d", match({})),
    ]);
    expect(r?.english).toEqual({
      asking: 3,
      askingPct: 75,
      met: 1,
      levels: [
        ["Básico", 0],
        ["Intermedio (B2)", 1],
        ["Avanzado (C1+)", 2],
      ],
      notAsking: 1,
    });
  });

  it("ranks missing skills by frequency, ties alphabetical, capped at 15", () => {
    const many = Array.from({ length: 20 }, (_, i) => `S${String(i).padStart(2, "0")}`);
    const r = analyze([
      app("a", match({ hardX: ["Docker", "AWS"], softX: ["Liderazgo"] })),
      app("b", match({ hardX: ["Docker"] })),
      app("c", match({ hardX: many })),
    ]);
    expect(r?.topMissing.slice(0, 3)).toEqual([
      ["Docker", 2],
      ["AWS", 1],
      ["Liderazgo", 1],
    ]);
    expect(r?.topMissing).toHaveLength(15);
    expect(r?.topMissingName).toBe("Docker");
  });

  it("ranks the most requested skills with whether the CV has them", () => {
    const r = analyze([
      app("a", match({ hardM: ["React"], hardX: ["Docker"] })),
      app("b", match({ hardM: ["React"], softM: ["Liderazgo"] })),
    ]);
    expect(r?.requested).toEqual([
      { skill: "React", count: 2, have: true },
      { skill: "Docker", count: 1, have: false },
      { skill: "Liderazgo", count: 1, have: true },
    ]);
  });

  it("averages the match percentage rounded", () => {
    expect(analyze([app("a", match({ pct: 40 })), app("b", match({ pct: 45 }))])?.avgPct).toBe(43);
  });

  it("has no top missing skill when nothing is missing", () => {
    const r = analyze([app("a", match({ hardM: ["React"] }))]);
    expect(r?.topMissing).toEqual([]);
    expect(r?.topMissingName).toBeNull();
  });
});
