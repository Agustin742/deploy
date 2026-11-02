import { describe, expect, it } from "vitest";
import { JD_EXAMPLE } from "@/features/matching/domain/example";
import { computeMatch } from "@/features/matching/domain/engine";
import type { Platform, Profile } from "@/features/state/domain/types";
import {
  ECOLOR,
  EN_PROCESO,
  ESTADOS,
  EXTRA_FUENTES,
  guessSource,
  newApp,
  PLATS,
  PRE,
  recalcMatch,
  SIN_RESPUESTA,
  sources,
} from "./applications";

describe("application constants", () => {
  it("lists the pipeline states in order", () => {
    expect(ESTADOS).toEqual([
      "Por postular",
      "Postulado",
      "En revisión",
      "Entrevista",
      "Prueba técnica",
      "Oferta",
      "Rechazado",
      "Sin respuesta",
    ]);
  });

  it("maps every state to a color token", () => {
    expect(Object.keys(ECOLOR)).toEqual([...ESTADOS]);
    expect(ECOLOR["Entrevista"]).toBe("warn");
    expect(ECOLOR["Oferta"]).toBe("ok");
    expect(ECOLOR["Rechazado"]).toBe("bad");
    expect(ECOLOR["Postulado"]).toBe("info");
    expect(ECOLOR["Por postular"]).toBe("neutral");
  });

  it("groups in-process and unanswered states", () => {
    expect(EN_PROCESO).toEqual(["En revisión", "Entrevista", "Prueba técnica"]);
    expect(SIN_RESPUESTA).toEqual(["Por postular", "Postulado", "Sin respuesta"]);
    expect(EXTRA_FUENTES).toEqual(["Referido", "Web de la empresa", "Otra"]);
  });

  it("lists the job platforms with slug ids", () => {
    expect(PLATS).toHaveLength(19);
    expect(PLATS[0]).toEqual({
      id: "linkedin",
      name: "LinkedIn",
      url: "https://www.linkedin.com/jobs/",
    });
    expect(PLATS.map((p) => p.id)).toContain("kala-talent");
    expect(PLATS.map((p) => p.id)).toContain("torre-ai");
    expect(PLATS.map((p) => p.id)).toContain("real-work-from-anywhere");
    expect(new Set(PLATS.map((p) => p.id)).size).toBe(PLATS.length);
    expect(PLATS[PLATS.length - 1].name).toBe("RemoteOK");
  });

  it("lists the pre-interview checklist", () => {
    expect(PRE).toHaveLength(8);
    expect(PRE[0]).toEqual(["quien", "¿Quién me entrevista? (nombre, cargo, LinkedIn)"]);
    expect(PRE[7][0]).toBe("preguntas");
  });
});

describe("newApp", () => {
  it("creates an application with legacy defaults", () => {
    const a = newApp({}, "2026-03-11");
    expect(a).toMatchObject({
      fecha: "2026-03-11",
      empresa: "",
      puesto: "",
      link: "",
      fuente: "",
      estado: "Postulado",
      respuesta: "",
      reclutador: "",
      contacto: "",
      proximos: "",
      comentarios: "",
      jd: "",
      match: null,
      report: "",
      entrevistas: [],
      revisado: false,
      hallazgos: "",
      ficha: { industria: "", tamano: "", modalidad: "", valores: "", cultura: "", notas: "" },
    });
    expect(a.id).toMatch(/^[a-z0-9]+$/);
  });

  it("applies overrides and generates distinct ids", () => {
    const a = newApp({ empresa: "Acme", estado: "Por postular" }, "2026-03-11");
    expect(a.empresa).toBe("Acme");
    expect(a.estado).toBe("Por postular");
    expect(newApp({}, "2026-03-11").id).not.toBe(newApp({}, "2026-03-11").id);
  });
});

describe("sources and guessSource", () => {
  const platforms: Platform[] = PLATS;

  it("lists platform names followed by the extra sources", () => {
    const s = sources(platforms);
    expect(s[0]).toBe("LinkedIn");
    expect(s.slice(-3)).toEqual(["Referido", "Web de la empresa", "Otra"]);
    expect(s).toHaveLength(platforms.length + 3);
  });

  it("recognizes LinkedIn and Indeed by url", () => {
    expect(guessSource("https://www.linkedin.com/jobs/view/1", platforms)).toBe("LinkedIn");
    expect(guessSource("https://ar.indeed.com/viewjob?jk=1", platforms)).toBe("Indeed");
  });

  it("recognizes other known platforms by hostname", () => {
    expect(guessSource("https://www.getonbrd.com/jobs/x", platforms)).toBe("Get on Board");
    expect(guessSource("https://tecla.io/jobs/1", platforms)).toBe("Tecla");
    expect(guessSource("https://remotive.com/remote-jobs/1", platforms)).toBe("Remotive");
  });

  it("returns an empty string for unknown urls", () => {
    expect(guessSource("https://example.org/jobs", platforms)).toBe("");
    expect(guessSource("", platforms)).toBe("");
  });

  it("ignores platforms with malformed urls", () => {
    const bad: Platform[] = [{ id: "x", name: "X", url: "not a url" }];
    expect(guessSource("https://x.com", bad)).toBe("");
  });
});

describe("recalcMatch", () => {
  const profile: Profile = {
    name: "",
    nameAuto: true,
    shareName: false,
    headline: "Frontend Developer",
    years: "3",
    english: "3",
    extraSkills: "",
    cv: "Desarrolladora frontend con 3 años de experiencia en React, TypeScript, HTML5, CSS3, Git y Jest.",
  };

  it("stores the computed match when there is a job description", () => {
    const app = { ...newApp({ jd: JD_EXAMPLE }, "2026-03-11") };
    const out = recalcMatch(app, profile, "2026-03-11");
    expect(out.match).toEqual(computeMatch(JD_EXAMPLE, profile, "2026-03-11"));
    expect(out.match && "pct" in out.match).toBe(true);
  });

  it("stores null when the match cannot be computed", () => {
    const app = newApp({ jd: "demasiado corto" }, "2026-03-11");
    expect(recalcMatch(app, profile, "2026-03-11").match).toBeNull();
  });

  it("leaves the application untouched when it has no job description", () => {
    const app = newApp({}, "2026-03-11");
    expect(recalcMatch(app, profile, "2026-03-11")).toEqual(app);
  });

  it("does not mutate the input", () => {
    const app = newApp({ jd: JD_EXAMPLE }, "2026-03-11");
    recalcMatch(app, profile, "2026-03-11");
    expect(app.match).toBeNull();
  });
});
