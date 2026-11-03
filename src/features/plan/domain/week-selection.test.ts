import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import { MAX_VARS } from "./indicators";
import { shiftWeek, toggleWeekVar } from "./week-selection";

const WEEK = "2026-11-02";

describe("toggleWeekVar", () => {
  it("adds a visible variable to the week", () => {
    const r = toggleWeekVar(blank(), WEEK, "networking", true);
    expect(r.ok).toBe(true);
    expect(r.state.planVars[WEEK]).toEqual(["networking"]);
  });

  it("removes a variable", () => {
    const first = toggleWeekVar(blank(), WEEK, "networking", true).state;
    const second = toggleWeekVar(first, WEEK, "networking", false);
    expect(second.ok).toBe(true);
    expect(second.state.planVars[WEEK]).toEqual([]);
  });

  it("refuses a sixth variable and leaves the state untouched", () => {
    let state = blank();
    const ids = ["networking", "empresas", "puestos", "plataformas", "postulaciones"];
    expect(ids).toHaveLength(MAX_VARS);
    for (const id of ids) state = toggleWeekVar(state, WEEK, id, true).state;
    const sixth = toggleWeekVar(state, WEEK, "comunidades", true);
    expect(sixth.ok).toBe(false);
    expect(sixth.state).toBe(state);
  });

  it("keeps other weeks unchanged", () => {
    const a = toggleWeekVar(blank(), WEEK, "networking", true).state;
    const b = toggleWeekVar(a, "2026-11-09", "empresas", true).state;
    expect(b.planVars[WEEK]).toEqual(["networking"]);
    expect(b.planVars["2026-11-09"]).toEqual(["empresas"]);
  });
});

describe("shiftWeek", () => {
  it("moves by whole weeks", () => {
    expect(shiftWeek(WEEK, 7)).toBe("2026-11-09");
    expect(shiftWeek(WEEK, -7)).toBe("2026-10-26");
  });
});
