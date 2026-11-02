import { describe, expect, it } from "vitest";
import type { Profile } from "@/features/state/domain/types";
import golden from "./__fixtures__/legacy-golden.json";
import { JD_EXAMPLE } from "./example";
import {
  band,
  computeMatch,
  engLevel,
  hasCv,
  ENG_TXT,
  maxYears,
  reqYears,
  tokens,
} from "./engine";
import { SKILLS, STOP_WORDS } from "./skills";

// Expected values in legacy-golden.json were produced by running the original
// artifact code (legacy/index.html) on the same inputs.

const TODAY = "2026-11-01";

const CV = `# MARIA FERNANDEZ
Desarrolladora Frontend
maria@mail.com | +54 9 11 5555 5555

Experiencia
Frontend en una fintech durante 2 años: React, TypeScript, HTML5 y CSS3 con Sass.
Consumo de APIs REST, Git y GitHub, testing con Jest.
Trabajo en equipo en squads con metodologías ágiles (Scrum), muy proactiva.
Inglés intermedio (B2).`;

const profile = (over: Partial<Profile> = {}): Profile => ({
  name: "Maria Fernandez",
  nameAuto: true,
  shareName: true,
  headline: "Frontend Developer",
  years: "2",
  english: "2",
  extraSkills: "Figma, Storybook",
  cv: CV,
  ...over,
});

const BACKEND_JD =
  "Seeking a Senior Backend Engineer with 5+ years of experience in Python, Django, PostgreSQL and AWS. Docker and Kubernetes a plus. Strong communication and leadership. Fluent English required. Experience with Terraform and Kafka is valued, plus data pipelines and observability.";

describe("skill dictionary", () => {
  it("matches the legacy dictionary exactly (names, kinds and alias patterns)", () => {
    const actual = SKILLS.map((s) => [s.n, s.k, s.res.map((r) => r.source)]);
    expect(actual).toEqual(golden.sk);
  });

  it("has a stop-word list", () => {
    expect(STOP_WORDS.has("para")).toBe(true);
    expect(STOP_WORDS.has("react")).toBe(false);
  });
});

describe("helpers", () => {
  it("tokens extracts normalized keyword candidates", () => {
    expect(tokens(JD_EXAMPLE.toLowerCase())).toEqual(golden.tokens);
    expect(tokens("el de la y")).toEqual([]);
  });

  it("reqYears prefers the smallest figure near the word 'experiencia'", () => {
    expect(reqYears("3+ anos de experiencia con react")).toBe(3);
    expect(reqYears("2 anos de experiencia o 5 anos de experiencia")).toBe(2);
    expect(reqYears("la empresa tiene 8 anos en el mercado")).toBe(8);
    expect(reqYears("sin datos")).toBeNull();
    expect(reqYears("20 anos de experiencia")).toBeNull(); // above 15 is ignored
  });

  it("maxYears returns the largest plausible figure", () => {
    expect(maxYears("2 anos en x y 10 anos en y")).toBe(10);
    expect(maxYears("45 anos")).toBeNull();
    expect(maxYears("nada")).toBeNull();
  });

  it("engLevel reads the requested English level", () => {
    expect(engLevel("nada")).toBe(0);
    expect(engLevel("ingles avanzado")).toBe(3);
    expect(engLevel("english c1")).toBe(3);
    expect(engLevel("english b2 required")).toBe(2);
    expect(engLevel("ingles basico")).toBe(1);
    expect(engLevel("ingles")).toBe(2);
    expect(ENG_TXT).toEqual(["", "Básico", "Intermedio (B2)", "Avanzado (C1+)"]);
  });

  it("hasCv needs at least 40 characters of CV", () => {
    expect(hasCv({ cv: "x".repeat(39) })).toBe(false);
    expect(hasCv({ cv: "  " + "x".repeat(40) + "  " })).toBe(true);
    expect(hasCv({ cv: "" })).toBe(false);
  });

  it("band maps a percentage to a color token and label", () => {
    expect(band(75)).toEqual(["ok", "Alto"]);
    expect(band(74)).toEqual(["warn", "Medio"]);
    expect(band(50)).toEqual(["warn", "Medio"]);
    expect(band(49)).toEqual(["bad", "Bajo"]);
  });
});

describe("computeMatch", () => {
  it("returns a jd error for a short job description", () => {
    expect(computeMatch("corto", profile(), TODAY)).toEqual(golden.errJd);
  });

  it("returns a cv error when there is no CV", () => {
    expect(
      computeMatch(JD_EXAMPLE, profile({ cv: "", headline: "", extraSkills: "" }), TODAY),
    ).toEqual(golden.errCv);
  });

  it("scores the sample job description against a sample CV", () => {
    expect(computeMatch(JD_EXAMPLE, profile(), TODAY)).toEqual(golden.ejemplo);
  });

  it("falls back to CV-derived years and English when the profile has none", () => {
    expect(computeMatch(JD_EXAMPLE, profile({ years: "", english: "" }), TODAY)).toEqual(
      golden.ejemploNoYears,
    );
  });

  it("counts custom extra skills that appear in the offer", () => {
    expect(
      computeMatch(
        BACKEND_JD,
        profile({ headline: "", extraSkills: "Terraform, Kafka", years: "", english: "" }),
        TODAY,
      ),
    ).toEqual(golden.backend);
  });

  it("reports 0 matches and unmet English when the CV has nothing relevant", () => {
    expect(
      computeMatch(
        BACKEND_JD,
        profile({
          cv: "Soy una persona muy organizada con mucha experiencia en ventas y atención al cliente durante 12 años en distintas empresas del rubro.",
          headline: "",
          extraSkills: "",
          years: "",
          english: "",
        }),
        TODAY,
      ),
    ).toEqual(golden.backendNoSkills);
  });

  it("defaults the date stamp to today", () => {
    const r = computeMatch(JD_EXAMPLE, profile());
    expect("pct" in r && /^\d{4}-\d{2}-\d{2}$/.test(r.at)).toBe(true);
  });
});
