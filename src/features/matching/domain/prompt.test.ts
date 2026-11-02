import { describe, expect, it } from "vitest";
import type { Profile } from "@/features/state/domain/types";
import golden from "./__fixtures__/legacy-golden.json";
import { buildPrompt, PROMPT_HEAD } from "./prompt";

// Expected strings were produced by running the original artifact code.

const base: Profile = {
  name: "Maria Fernandez",
  nameAuto: true,
  shareName: true,
  headline: "Frontend Developer",
  years: "2",
  english: "2",
  extraSkills: "Figma, Storybook",
  cv: `# MARIA FERNANDEZ
Desarrolladora Frontend
maria@mail.com | +54 9 11 5555 5555

Experiencia
Frontend en una fintech durante 2 años: React, TypeScript, HTML5 y CSS3 con Sass.
Consumo de APIs REST, Git y GitHub, testing con Jest.
Trabajo en equipo en squads con metodologías ágiles (Scrum), muy proactiva.
Inglés intermedio (B2).`,
};

describe("job matching prompt", () => {
  it("keeps the prompt header text identical", () => {
    expect(PROMPT_HEAD).toBe(golden.head);
  });

  it("includes the shared name, profile fields, redacted CV and the offer", () => {
    expect(buildPrompt({ empresa: "Acme", puesto: "Frontend Dev", jd: "JD TEXT" }, base)).toBe(
      golden.prompt1,
    );
  });

  it("omits the job title line when there is no company or position", () => {
    expect(buildPrompt({ empresa: "", puesto: "", jd: "JD ONLY" }, base)).toBe(golden.prompt2);
  });

  it("hides the name when not shared and redacts emails and phones from the CV", () => {
    const p: Profile = {
      ...base,
      name: "Zed",
      shareName: false,
      headline: "",
      years: "",
      english: "",
      extraSkills: "",
      cv: "Linea uno juan@x.com\n+54 11 5555 5555",
    };
    const out = buildPrompt({ empresa: "Solo Co", puesto: "", jd: "JD" }, p);
    expect(out).toBe(golden.prompt3);
    expect(out).not.toContain("juan@x.com");
    expect(out).not.toContain("Nombre:");
  });

  it("prints zero years and the English label", () => {
    const p = {
      ...base,
      name: "Zed",
      shareName: true,
      headline: "H",
      years: 0,
      english: "3",
      extraSkills: "",
      cv: "",
    } as unknown as Profile;
    expect(buildPrompt({ empresa: "", puesto: "Dev", jd: "JD" }, p)).toBe(golden.prompt4);
  });
});
