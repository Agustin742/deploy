import { describe, expect, it } from "vitest";
import { escapeRegExp, norm, slug } from "./text";

describe("text", () => {
  it("norm lowercases and strips diacritics", () => {
    expect(norm("Educación Ñandú ÁÉÍÓÚ")).toBe("educacion nandu aeiou");
    expect(norm(null)).toBe("");
    expect(norm(undefined)).toBe("");
  });

  it("slug builds url-safe ids", () => {
    expect(slug("Kala Talent")).toBe("kala-talent");
    expect(slug("Torre.ai")).toBe("torre-ai");
    expect(slug("Real Work From Anywhere")).toBe("real-work-from-anywhere");
    expect(slug("--Hola Mundo--")).toBe("hola-mundo");
  });

  it("escapeRegExp escapes regex metacharacters including slash", () => {
    expect(escapeRegExp("c++")).toBe("c\\+\\+");
    expect(escapeRegExp("ci/cd")).toBe("ci\\/cd");
    expect(escapeRegExp("node.js")).toBe("node\\.js");
    expect(new RegExp(escapeRegExp("a.b*c")).test("a.b*c")).toBe(true);
    expect(new RegExp(escapeRegExp("a.b*c")).test("aXbbc")).toBe(false);
  });
});
