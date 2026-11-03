import { describe, expect, it } from "vitest";
import { parseGoal } from "./goal";

describe("parseGoal", () => {
  it("accepts positive values", () => {
    expect(parseGoal("12")).toEqual({ goal: 12, goalSet: true });
  });

  it("caps the goal at 500", () => {
    expect(parseGoal("900")).toEqual({ goal: 500, goalSet: true });
  });

  it("clears the goal for empty, zero, negative or invalid input", () => {
    for (const raw of ["", "0", "-3", "abc"]) {
      expect(parseGoal(raw)).toEqual({ goal: 0, goalSet: false });
    }
  });
});
