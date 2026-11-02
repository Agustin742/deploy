import { describe, expect, it } from "vitest";
import sample from "@/features/state/domain/__fixtures__/sample-state.json";
import { blank } from "@/features/state/domain/state";
import type { AppState, Mods, Objetivo } from "@/features/state/domain/types";
import golden from "./__fixtures__/legacy-plan.json";
import { indicatorValue, MAX_VARS, nInd, VARS, type IndicatorContext } from "./indicators";
import { objectiveWarnings, plazoObj } from "./objectives";
import { formatPeriodSummary, periodSummary } from "./period";
import {
  lastRed,
  postsWeek,
  redDiff,
  topMissingSkills,
} from "./metrics";
import { varNames, varOpts, visVars, weekVars } from "./variables";

// legacy-plan.json was produced by running the original artifact code on
// sample-state.json with today fixed to 2026-03-11 (week starts 2026-03-09).

const TODAY = "2026-03-11";
const WEEK = "2026-03-09";

const full = { ...blank(), ...sample } as unknown as AppState;
const modsOff = { ...full, mods: blank().mods } as AppState;
const scenarios: Record<"modsOn" | "modsOff" | "blank", AppState> = {
  modsOn: full,
  modsOff,
  blank: blank(),
};

const ctx = (state: AppState): IndicatorContext => ({ state, today: TODAY });

describe("constants", () => {
  it("allows up to 5 variables per week", () => {
    expect(MAX_VARS).toBe(5);
  });

  it("defines the 14 program variables in order", () => {
    expect(VARS.map((v) => v.id)).toEqual(golden.modsOn.vars.map((v) => v.id));
    expect(VARS).toHaveLength(14);
  });
});

describe.each(Object.entries(scenarios))("indicators (%s)", (name, state) => {
  const g = golden[name as keyof typeof scenarios];

  g.vars.forEach((gv) => {
    it(`variable "${gv.id}" keeps its definition and values`, () => {
      const v = VARS.find((x) => x.id === gv.id);
      expect(v).toBeDefined();
      if (!v) return;
      expect(v.n).toBe(gv.n);
      expect(v.t).toBe(gv.t);
      expect(v.mod ?? null).toBe(gv.mod);
      expect(v.tab).toBe(gv.tab);
      expect(v.d ?? null).toBe(gv.d);
      expect(nInd(v)).toBe(gv.nInd);
      const rows = (list: typeof v.act) =>
        list.map(([label, fn, fixed]) => [label, indicatorValue(fn, ctx(state)), fixed ?? null]);
      expect(rows(v.act)).toEqual(gv.act);
      expect(rows(v.res)).toEqual(gv.res);
    });
  });

  it("filters the visible variables by enabled modules", () => {
    expect(visVars(state).map((v) => v.id)).toEqual(g.visVars);
    expect(varNames(state)).toEqual(g.varNames);
  });

  it("resolves the variables selected for a week, dropping hidden or unknown ones", () => {
    expect(weekVars(state, WEEK)).toEqual(g.weekVars);
    expect(weekVars(state, "2026-03-02")).toEqual(g.weekVarsEmpty);
  });

  it("offers variable names for an objective", () => {
    const it = (o: Partial<Objetivo>) => o as Objetivo;
    expect(varOpts(state, it({ periodo: "Mensual" }), TODAY)).toEqual(g.varOptsMonthly);
    expect(varOpts(state, it({ periodo: "Semanal", semana: WEEK }), TODAY)).toEqual(
      g.varOptsWeekly,
    );
    expect(varOpts(state, it({ periodo: "Semanal", semana: "2026-03-02" }), TODAY)).toEqual(
      g.varOptsWeeklyNoSel,
    );
    expect(varOpts(state, it({ periodo: "Semanal" }), TODAY)).toEqual(g.varOptsWeeklyDefault);
  });

  it("derives network, post and skill metrics", () => {
    expect(topMissingSkills(state)).toBe(g.topMiss);
    expect(redDiff(state, "conexiones")).toBe(g.redDiffConexiones);
    expect(redDiff(state, "paginas")).toBe(g.redDiffPaginas);
    expect(lastRed(state)?.id ?? null).toBe(g.lastRedId);
    expect(g.postsWeek.map(([w]) => [w, postsWeek(state, w as string)])).toEqual(g.postsWeek);
  });
});

describe("indicatorValue", () => {
  it("falls back to an em dash when a calculation throws", () => {
    expect(
      indicatorValue(() => {
        throw new Error("boom");
      }, ctx(blank())),
    ).toBe("—");
  });
});

describe("plazoObj", () => {
  golden.plazoObj.forEach(([input, expected]) => {
    it(`deadline for ${JSON.stringify(input)} is ${JSON.stringify(expected)}`, () => {
      expect(plazoObj(input as Objetivo, TODAY)).toBe(expected);
    });
  });
});

describe("objectiveWarnings", () => {
  it("warns about a missing deadline and indicator", () => {
    expect(objectiveWarnings({ objetivo: "x" } as Objetivo)).toEqual([
      "Falta el plazo.",
      "Falta el indicador: ¿cómo vas a saber que avanzó?",
    ]);
  });

  it("warns only about what is missing", () => {
    expect(objectiveWarnings({ objetivo: "x", plazo: "2026-03-15" } as Objetivo)).toEqual([
      "Falta el indicador: ¿cómo vas a saber que avanzó?",
    ]);
  });

  it("does not warn for an empty or complete objective", () => {
    expect(objectiveWarnings({ objetivo: "" } as Objetivo)).toEqual([]);
    expect(
      objectiveWarnings({ objetivo: "x", plazo: "p", indicador: "i" } as Objetivo),
    ).toEqual([]);
  });

  it("matches the legacy warning text", () => {
    golden.warn.forEach(([input, text]) => {
      expect(objectiveWarnings(input as Objetivo).join("")).toBe(text);
    });
  });
});

describe("period summary", () => {
  it("is null while the period is incomplete", () => {
    expect(periodSummary(full, { desde: "", hasta: "2026-03-08" })).toBeNull();
    expect(periodSummary(full, { desde: "2026-03-01", hasta: "" })).toBeNull();
  });

  it("counts the activity inside the period", () => {
    expect(periodSummary(full, { desde: "2026-03-01", hasta: "2026-03-08" })).toEqual({
      sent: 3,
      network: 0,
      posts: 1,
      interviews: 1,
      realMinutes: 135,
      estimatedMinutes: 90,
    });
  });

  it("formats the summary like the legacy box", () => {
    golden.period.forEach(([input, text]) => {
      const i = input as { desde: string; hasta: string };
      expect(formatPeriodSummary(periodSummary(full, i))).toBe(text);
    });
  });
});

describe("mods typing", () => {
  it("exposes every module flag in blank state", () => {
    const keys: (keyof Mods)[] = [
      "valores",
      "marca",
      "empleadores",
      "seguimiento",
      "informativas",
      "experimentos",
      "visibilidad",
      "ia",
    ];
    expect(Object.keys(blank().mods)).toEqual(keys);
  });
});
