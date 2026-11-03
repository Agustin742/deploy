import { describe, expect, it } from "vitest";
import { recognizedSkills } from "./cv-skills";

const profile = (patch: Partial<{ cv: string; headline: string; extraSkills: string }>) => ({
  cv: "",
  headline: "",
  extraSkills: "",
  ...patch,
});

describe("recognizedSkills", () => {
  it("finds known skills in the CV, headline and extra skills, with their kind", () => {
    const r = recognizedSkills(profile({ cv: "Trabajo con React y Docker", headline: "Líder técnico", extraSkills: "git" }));
    expect(r.found.map((s) => [s.n, s.k])).toEqual(expect.arrayContaining([["React", "h"], ["Docker", "h"], ["Git", "h"], ["Liderazgo", "s"]]));
  });

  it("lists the extra skills as typed, split by comma, semicolon or newline", () => {
    expect(recognizedSkills(profile({ extraSkills: " Astro, Three.js;Accesibilidad\n  " })).extra).toEqual(["Astro", "Three.js", "Accesibilidad"]);
  });

  it("returns nothing for an empty profile", () => {
    expect(recognizedSkills(profile({}))).toEqual({ found: [], extra: [] });
  });
});
