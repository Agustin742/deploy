import { computeMatch } from "@/features/matching/domain/engine";
import type { Application, Platform, Profile } from "@/features/state/domain/types";
import { uid } from "@/shared/lib/ids";
import { norm } from "@/shared/lib/text";
import { PLATS } from "./platforms";

export { PLATS };

export const ESTADOS = [
  "Por postular",
  "Postulado",
  "En revisión",
  "Entrevista",
  "Prueba técnica",
  "Oferta",
  "Rechazado",
  "Sin respuesta",
] as const;

export type ColorToken = "neutral" | "info" | "warn" | "ok" | "bad";

export const ECOLOR: Record<(typeof ESTADOS)[number], ColorToken> = {
  "Por postular": "neutral",
  Postulado: "info",
  "En revisión": "info",
  Entrevista: "warn",
  "Prueba técnica": "warn",
  Oferta: "ok",
  Rechazado: "bad",
  "Sin respuesta": "neutral",
};

/** States of a process that is moving forward. */
export const EN_PROCESO: readonly string[] = ["En revisión", "Entrevista", "Prueba técnica"];

/** States that mean no answer has been received yet. */
export const SIN_RESPUESTA: readonly string[] = ["Por postular", "Postulado", "Sin respuesta"];

export const EXTRA_FUENTES: readonly string[] = ["Referido", "Web de la empresa", "Otra"];

/** Pre-interview checklist: things to find out before the interview. */
export const PRE: ReadonlyArray<readonly [string, string]> = [
  ["quien", "¿Quién me entrevista? (nombre, cargo, LinkedIn)"],
  ["formato", "Formato, duración y herramienta (Meet, Zoom, presencial)"],
  ["etapas", "Cuántas etapas tiene el proceso y qué viene después"],
  ["puesto", "Qué se espera del puesto y del equipo en los primeros meses"],
  ["empresa", "Qué hace la empresa, novedades recientes y cultura"],
  ["salario", "Rango salarial y tipo de contratación"],
  ["modalidad", "Modalidad, horarios y zona horaria"],
  ["preguntas", "Preguntas que quiero hacerles a ellos"],
];

export function newApp(overrides: Partial<Application>, today: string): Application {
  return {
    id: uid(),
    fecha: today,
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
    ...overrides,
  };
}

/** Names of the platforms plus the extra sources, used for the "source" selector. */
export const sources = (platforms: readonly Platform[]): string[] =>
  platforms.map((p) => p.name).concat(EXTRA_FUENTES);

/** Guesses the source platform from a job url. */
export function guessSource(url: string, platforms: readonly Platform[]): string {
  const u = norm(url);
  if (u.includes("linkedin")) return "LinkedIn";
  if (u.includes("indeed")) return "Indeed";
  const found = platforms.find((p) => {
    try {
      return u.includes(new URL(p.url).hostname.replace(/^www\./, "").split(".")[0]);
    } catch {
      return false;
    }
  });
  return found ? found.name : "";
}

/** Recomputes the stored match when the application has a job description. */
export function recalcMatch(app: Application, profile: Profile, today: string): Application {
  if (!app.jd) return app;
  const m = computeMatch(app.jd, profile, today);
  return { ...app, match: "err" in m ? null : m };
}
