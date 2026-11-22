import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail, parseEmailList } from "./email";

describe("email", () => {
  it("normalizes by trimming and lowercasing", () => {
    expect(normalizeEmail("  Ana@Example.COM ")).toBe("ana@example.com");
  });

  it("validates the basic shape", () => {
    expect(isValidEmail("ana@example.com")).toBe(true);
    expect(isValidEmail(" Ana@Example.com ")).toBe(true);
    for (const bad of ["", "ana", "ana@", "@example.com", "ana@example", "a b@example.com", "ana@@example.com"]) {
      expect(isValidEmail(bad)).toBe(false);
    }
    expect(isValidEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });

  it("parses a separated list, normalized and de-duplicated", () => {
    expect(parseEmailList(" A@x.com, b@x.com;a@X.com\n")).toEqual(["a@x.com", "b@x.com"]);
    expect(parseEmailList(undefined)).toEqual([]);
    expect(parseEmailList("")).toEqual([]);
  });
});
