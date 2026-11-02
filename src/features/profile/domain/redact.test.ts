import { describe, expect, it } from "vitest";
import { redact } from "./redact";

describe("redact", () => {
  it("hides emails", () => {
    expect(redact("Escribime a juan.perez+cv@mail.example.com por favor")).toBe(
      "Escribime a [email omitido] por favor",
    );
  });

  it("hides phone numbers with 9 or more digits", () => {
    expect(redact("Tel: +54 11 5555-5555")).toBe("Tel: [número omitido]");
    expect(redact("Cel 011 15 4444 3333")).toBe("Cel [número omitido]");
    // legacy quirk: a leading parenthesis is not part of the match
    expect(redact("Cel (011) 15 4444 3333")).toBe("Cel ([número omitido]");
  });

  it("keeps digit groups with fewer than 9 digits", () => {
    expect(redact("Trabajé de 2019 a 2023 en 12 proyectos")).toBe(
      "Trabajé de 2019 a 2023 en 12 proyectos",
    );
    expect(redact("Ref 1234-5678")).toBe("Ref 1234-5678");
  });

  it("handles empty and nullish input", () => {
    expect(redact("")).toBe("");
    expect(redact(undefined)).toBe("");
    expect(redact(null)).toBe("");
  });
});
