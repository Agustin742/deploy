import { describe, expect, it } from "vitest";
import { sum } from "./numbers";

describe("sum", () => {
  it("adds numbers, coercing numeric strings and ignoring junk", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum(["4", "5"])).toBe(9);
    expect(sum([1, "", undefined, null, "x", 2])).toBe(3);
    expect(sum([])).toBe(0);
  });
});
