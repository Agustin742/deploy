import { PLATS } from "@/features/applications/domain/platforms";
import { todayIso } from "@/shared/lib/dates";
import type { AppState } from "./types";

export const STORAGE_KEY = "radar-postulaciones-v1";

/** Keys of the state that hold lists of records. */
export const LISTAS = [
  "objetivos",
  "contactos",
  "red",
  "posts",
  "tiempos",
  "revisiones",
  "empleadores",
  "experimentos",
  "metricas",
  "descansos",
] as const;

export const blank = (): AppState => ({
  profile: {
    name: "",
    nameAuto: true,
    shareName: false,
    headline: "",
    years: "",
    english: "",
    extraSkills: "",
    cv: "",
  },
  apps: [],
  platforms: PLATS.map((p) => ({ ...p })),
  checks: {},
  goal: 0,
  goalSet: false,
  draft: { empresa: "", puesto: "", link: "", fuente: "", estado: "Postulado", jd: "" },
  mods: {
    valores: false,
    marca: false,
    empleadores: false,
    seguimiento: false,
    informativas: false,
    experimentos: false,
    visibilidad: false,
    ia: false,
  },
  objetivos: [],
  contactos: [],
  red: [],
  posts: [],
  tiempos: [],
  revisiones: [],
  empleadores: [],
  experimentos: [],
  metricas: [],
  descansos: [],
  metas: {},
  base: { activos: "", aspiraciones: "", mercado: "", sintesis: "", objetivoLaboral: "" },
  marca: { promesa: "", audiencia: "", historia: "", titular: "" },
  revFreq: "",
  planVars: {},
});

type Loose = Record<string, unknown>;

const isObject = (v: unknown): v is Loose => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Builds a full state from any saved JSON (including older shapes), filling
 * defaults and applying the legacy migrations. The input is not mutated.
 */
export function hydrate(raw: unknown, today: string = todayIso()): AppState {
  const x: Loose = isObject(raw) ? (JSON.parse(JSON.stringify(raw)) as Loose) : {};
  const base = blank();
  const state = Object.assign(base, x) as unknown as AppState & Loose;
  const xProfile = (isObject(x.profile) ? x.profile : {}) as Loose;

  state.profile = Object.assign(blank().profile, x.profile || {});
  // Older saves without nameAuto: a name typed by hand stays manual (the old sample name does not count).
  if (
    isObject(x.profile) &&
    xProfile.nameAuto === undefined &&
    xProfile.name &&
    xProfile.name !== "Iván Gonzalez"
  ) {
    state.profile.nameAuto = false;
  }
  state.draft = Object.assign(blank().draft, x.draft || {});
  state.mods = Object.assign(blank().mods, x.mods || {});
  state.base = Object.assign(blank().base, x.base || {});
  state.marca = Object.assign(blank().marca, x.marca || {});
  if (!x.goalSet) state.goal = 0;
  LISTAS.forEach((k) => {
    if (!Array.isArray(state[k])) (state as Loose)[k] = [];
  });
  if (!state.metas || typeof state.metas !== "object") state.metas = {};
  if (!state.planVars || typeof state.planVars !== "object") state.planVars = {};
  delete (state as Loose).emociones;
  // Objectives saved before periods existed become monthly, using their deadline's month.
  state.objetivos.forEach((o) => {
    if (!o.periodo) {
      o.periodo = "Mensual";
      o.mes = (o.plazo || today).slice(0, 7);
      o.semana = "";
    }
  });
  if (!Array.isArray(state.apps)) state.apps = [];
  state.apps.forEach((a) => {
    a.entrevistas = a.entrevistas || [];
  });
  return state;
}
