import { describe, expect, it } from "vitest";
import type { Profile } from "@/features/state/domain/types";
import { guessName, syncProfileName } from "./name";

const profile = (over: Partial<Profile> = {}): Profile => ({
  name: "",
  nameAuto: true,
  shareName: false,
  headline: "",
  years: "",
  english: "",
  extraSkills: "",
  cv: "",
  ...over,
});

describe("guessName", () => {
  it("takes the first line that looks like a proper name", () => {
    expect(guessName("María Fernández\nDesarrolladora Frontend\nmaria@mail.com")).toBe(
      "María Fernández",
    );
  });

  it("strips markdown decoration around the name", () => {
    expect(guessName("# **Juan Pérez**\n\nResumen")).toBe("Juan Pérez");
    expect(guessName("> _Ana López_")).toBe("Ana López");
  });

  it("title-cases ALL CAPS words longer than two letters", () => {
    expect(guessName("CARLOS GOMEZ\nIngeniero")).toBe("Carlos Gomez");
  });

  it("keeps lowercase connectors", () => {
    expect(guessName("Juan de la Cruz")).toBe("Juan de la Cruz");
    expect(guessName("Ana María da Silva")).toBe("Ana María da Silva");
  });

  it("skips headings, contact lines and job titles", () => {
    const cv = [
      "Curriculum Vitae",
      "Perfil Profesional",
      "https://linkedin.com/in/x",
      "+54 11 5555-5555",
      "Desarrollador Frontend",
      "Laura Gómez",
    ].join("\n");
    expect(guessName(cv)).toBe("Laura Gómez");
  });

  it("only looks at the first 6 non-empty lines", () => {
    const cv = ["a", "b", "c", "d", "e", "f", "Pedro Ramírez"].join("\n");
    expect(guessName(cv)).toBe("");
  });

  it("rejects single words, lines with digits and lowercase words", () => {
    expect(guessName("Madonna")).toBe("");
    expect(guessName("Calle Falsa 123")).toBe("");
    expect(guessName("juan perez")).toBe("");
  });

  it("returns empty for empty or nullish input", () => {
    expect(guessName("")).toBe("");
    expect(guessName(undefined)).toBe("");
    expect(guessName(null)).toBe("");
  });
});

describe("syncProfileName", () => {
  it("derives the name from the CV when nameAuto is on", () => {
    const p = syncProfileName(profile({ cv: "Sofía Martínez\nQA Analyst" }));
    expect(p.name).toBe("Sofía Martínez");
    expect(p.nameAuto).toBe(true);
  });

  it("clears the name when the CV is empty and nameAuto is on", () => {
    expect(syncProfileName(profile({ name: "Viejo Nombre", cv: "" })).name).toBe("");
  });

  it("keeps the current name when the CV has no recognizable name", () => {
    expect(syncProfileName(profile({ name: "Keep Me", cv: "x y z sin nombre 123" })).name).toBe(
      "Keep Me",
    );
  });

  it("leaves a manually set name alone", () => {
    const p = syncProfileName(
      profile({ name: "Manual Name", nameAuto: false, cv: "Sofía Martínez\nQA" }),
    );
    expect(p.name).toBe("Manual Name");
  });

  it("migrates the sample name of older versions", () => {
    const p = syncProfileName(profile({ name: "Iván Gonzalez", cv: "" }));
    expect(p.name).toBe("");
    expect(p.nameAuto).toBe(true);
  });

  it("does not migrate the sample name when nameAuto is explicitly false", () => {
    const p = syncProfileName(profile({ name: "Iván Gonzalez", nameAuto: false }));
    expect(p.name).toBe("Iván Gonzalez");
    expect(p.nameAuto).toBe(false);
  });

  it("does not mutate its input", () => {
    const input = profile({ cv: "Sofía Martínez\nQA" });
    syncProfileName(input);
    expect(input.name).toBe("");
  });
});
