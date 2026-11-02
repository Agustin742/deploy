import { EN_PROCESO, SIN_RESPUESTA } from "@/features/applications/domain/applications";
import type { AppState, ModKey } from "@/features/state/domain/types";
import { addDays, mondayOf } from "@/shared/lib/dates";
import { sum } from "@/shared/lib/numbers";
import {
  fichaOk,
  lastRed,
  MIN_SEMANAL,
  postsWeek,
  redDiff,
  sentApps,
  topMissingSkills,
} from "./metrics";

/** The program shows at most this many variables per week. */
export const MAX_VARS = 5;

/** Indicators read from the state; `today` replaces the global clock of the original artifact. */
export interface IndicatorContext {
  state: AppState;
  today: string;
}

export type IndicatorFn = (ctx: IndicatorContext) => string | number;

/** [label, value calculation, (optional) fixed goal]. Numeric goals are set by the person or the coach. */
export type Indicator = readonly [label: string, fn: IndicatorFn, fixedGoal?: string];

export interface IndicatorVar {
  id: string;
  n: string;
  /** "actual" belongs to the program, "prop" is a proposal to validate. */
  t: "actual" | "prop";
  mod?: ModKey;
  tab: string;
  d?: string;
  opcional?: boolean;
  act: Indicator[];
  res: Indicator[];
}

/** Calculates an indicator, showing an em dash if it cannot be computed. */
export function indicatorValue(fn: IndicatorFn, ctx: IndicatorContext): string | number {
  try {
    return fn(ctx);
  } catch {
    return "—";
  }
}

export const nInd = (v: IndicatorVar): number => v.act.length + v.res.length;

const week = (ctx: IndicatorContext): string => mondayOf(ctx.today);
const month = (ctx: IndicatorContext): string => ctx.today.slice(0, 7);
const filled = (o: object): number =>
  Object.values(o).filter((x) => String(x || "").trim()).length;

const SENT_STATES_ADVANCED = ["En revisión", "Entrevista", "Prueba técnica", "Oferta"];

export const VARS: IndicatorVar[] = [
  {
    id: "networking",
    n: "Red de contactos",
    t: "actual",
    tab: "red",
    act: [
      ["Registros de la red cargados", ({ state }) => state.red.length],
      [
        "Registro cargado esta semana",
        (ctx) => (ctx.state.red.some((r) => r.fecha >= week(ctx)) ? "Sí" : "No"),
      ],
    ],
    res: [
      [
        "Conexiones (último registro)",
        ({ state }) => {
          const r = lastRed(state);
          return r && r.conexiones !== "" ? r.conexiones : "—";
        },
      ],
      [
        "Páginas (último registro)",
        ({ state }) => {
          const r = lastRed(state);
          return r && r.paginas !== "" ? r.paginas : "—";
        },
      ],
      ["Cambio de conexiones desde el registro anterior", ({ state }) => redDiff(state, "conexiones")],
    ],
  },
  {
    id: "empresas",
    n: "Investigación de empresas del rubro",
    t: "actual",
    tab: "postulaciones",
    act: [["Postulaciones con ficha de empresa cargada", ({ state }) => state.apps.filter(fichaOk).length]],
    res: [
      [
        "De esas, con proceso avanzado (revisión, entrevista, prueba u oferta)",
        ({ state }) =>
          state.apps.filter((a) => fichaOk(a) && SENT_STATES_ADVANCED.includes(a.estado)).length,
      ],
    ],
  },
  {
    id: "puestos",
    n: "Investigación de puestos",
    t: "actual",
    tab: "nueva",
    act: [
      [
        "Ofertas con descripción analizada",
        ({ state }) => state.apps.filter((a) => a.match && a.match.pct != null).length,
      ],
    ],
    res: [
      [
        "Coincidencia promedio con tu CV (estimación orientativa)",
        ({ state }) => {
          const m = state.apps.filter((a) => a.match && a.match.pct != null);
          return m.length
            ? Math.round(sum(m.map((a) => (a.match as { pct: number }).pct)) / m.length) + "%"
            : "—";
        },
      ],
    ],
  },
  {
    id: "plataformas",
    n: "Investigación de plataformas de empleo",
    t: "actual",
    tab: "busqueda",
    act: [
      [
        "Revisiones de plataformas este mes",
        (ctx) => {
          const c = ctx.state.checks[month(ctx)] || {};
          return sum(Object.values(c).map((d) => d.length));
        },
      ],
    ],
    res: [
      [
        "Fuentes con al menos una respuesta",
        ({ state }) =>
          new Set(
            sentApps(state)
              .filter((a) => a.fuente && !SIN_RESPUESTA.includes(a.estado))
              .map((a) => a.fuente),
          ).size,
      ],
    ],
  },
  {
    id: "postulaciones",
    n: "Postulaciones (directas, LinkedIn, plataformas)",
    t: "actual",
    tab: "postulaciones",
    act: [
      [
        "Postulaciones enviadas este mes",
        (ctx) => sentApps(ctx.state).filter((a) => a.fecha.slice(0, 7) === month(ctx)).length,
      ],
      ["Postulaciones enviadas en total", ({ state }) => sentApps(state).length],
    ],
    res: [
      [
        "Respuestas recibidas",
        ({ state }) => sentApps(state).filter((a) => !SIN_RESPUESTA.includes(a.estado)).length,
      ],
      ["Procesos en curso", ({ state }) => state.apps.filter((a) => EN_PROCESO.includes(a.estado)).length],
      ["Ofertas recibidas", ({ state }) => state.apps.filter((a) => a.estado === "Oferta").length],
    ],
  },
  {
    id: "comunidades",
    n: "Participación en comunidades / publicaciones en LinkedIn",
    t: "actual",
    tab: "visibilidad",
    act: [
      [
        "Publicaciones o participaciones esta semana",
        (ctx) => postsWeek(ctx.state, week(ctx)),
        "mín. 3 por semana (definido en tu programa)",
      ],
      [
        "Semanas con el mínimo cumplido (últimas 8)",
        (ctx) =>
          Array.from({ length: 8 }, (_, i) => postsWeek(ctx.state, addDays(week(ctx), -7 * i))).filter(
            (n) => n >= MIN_SEMANAL,
          ).length,
      ],
    ],
    res: [
      [
        "Interacciones recibidas (las que cargaste)",
        ({ state }) => sum(state.posts.map((p) => p.interacciones)),
      ],
    ],
  },
  {
    id: "entrevistas",
    n: "Entrevistas (preparación y feedback)",
    t: "actual",
    tab: "postulaciones",
    act: [
      [
        "Entrevistas registradas",
        ({ state }) => sum(state.apps.map((a) => (a.entrevistas || []).length)),
      ],
      [
        "Entrevistas con preparación anotada",
        ({ state }) =>
          sum(
            state.apps.map(
              (a) => (a.entrevistas || []).filter((e) => String(e.prep || "").trim()).length,
            ),
          ),
      ],
    ],
    res: [
      [
        "Procesos que llegaron a prueba técnica u oferta",
        ({ state }) => state.apps.filter((a) => ["Prueba técnica", "Oferta"].includes(a.estado)).length,
      ],
    ],
  },
  {
    id: "actualizacion",
    n: "Actualización profesional",
    t: "actual",
    tab: "plan",
    act: [
      [
        "Objetivos de actualización en curso o cumplidos",
        ({ state }) =>
          state.objetivos.filter(
            (o) => o.variable === "Actualización profesional" && ["En curso", "Hecho"].includes(o.estado),
          ).length,
      ],
    ],
    res: [["Skills que más te faltan (ver Análisis)", ({ state }) => topMissingSkills(state)]],
  },
  {
    id: "valores",
    n: "Valores y objetivo laboral",
    t: "prop",
    mod: "valores",
    tab: "plan",
    d: "Activos, aspiraciones y valores, realidades del mercado y objetivo laboral.",
    act: [["Campos de dirección completados (de 5)", ({ state }) => filled(state.base)]],
    res: [
      [
        "Objetivo laboral definido",
        ({ state }) => (String(state.base.objetivoLaboral || "").trim() ? "Sí" : "No"),
      ],
    ],
  },
  {
    id: "marca",
    n: "Marca personal y propuesta de valor",
    t: "prop",
    mod: "marca",
    tab: "plan",
    d: "Propuesta de valor, a quién te dirigís, historia y titular de LinkedIn.",
    act: [["Elementos de marca completados (de 4)", ({ state }) => filled(state.marca)]],
    res: [["Resultado: a definir por la persona o la coach", () => "—"]],
  },
  {
    id: "empleadores",
    n: "Lista de empleadores objetivo y priorización",
    t: "prop",
    mod: "empleadores",
    tab: "empleadores",
    d: "Lista finita de empleadores con quién conocés, interés y avisos actuales.",
    act: [
      ["Empleadores en la lista", ({ state }) => state.empleadores.length],
      ["Con prioridad asignada", ({ state }) => state.empleadores.filter((e) => e.prioridad).length],
    ],
    res: [
      [
        "Empleadores de prioridad alta",
        ({ state }) => state.empleadores.filter((e) => e.prioridad === "Alta").length,
      ],
    ],
  },
  {
    id: "experimentos",
    n: "Experimentos de rol (si hay cambio de carrera)",
    t: "prop",
    mod: "experimentos",
    tab: "experimentos",
    d: "Solo si estás considerando un cambio de carrera: probar a pequeña escala y aprender.",
    act: [["Experimentos registrados", ({ state }) => state.experimentos.length]],
    res: [
      [
        "Experimentos con decisión tomada (seguir, ajustar o descartar)",
        ({ state }) => state.experimentos.filter((e) => e.decision && e.decision !== "Pendiente").length,
      ],
    ],
  },
  {
    id: "visibilidad",
    n: "Indicadores de visibilidad en LinkedIn",
    t: "prop",
    mod: "visibilidad",
    tab: "visibilidad",
    d: "Mediciones periódicas que copiás de tu cuenta de LinkedIn.",
    act: [["Mediciones registradas", ({ state }) => state.metricas.length]],
    res: [
      [
        "Cambio de conexiones y vistas desde la medición anterior",
        ({ state }) => {
          const m = state.metricas.slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
          if (m.length < 2) return "—";
          const d = (k: "conexiones" | "vistas") =>
            m[0][k] !== "" && m[1][k] !== ""
              ? (+m[0][k] - +m[1][k] >= 0 ? "+" : "") + (+m[0][k] - +m[1][k])
              : "—";
          return `${d("conexiones")} / ${d("vistas")}`;
        },
      ],
    ],
  },
  {
    id: "ia",
    n: "Uso de IA con verificación humana",
    t: "prop",
    mod: "ia",
    tab: "postulaciones",
    d: "Marcar que revisaste cada informe de IA y anotar lo que corregiste.",
    act: [
      ["Informes de IA guardados", ({ state }) => state.apps.filter((a) => a.report).length],
      [
        "Con revisión humana marcada",
        ({ state }) => state.apps.filter((a) => a.report && a.revisado).length,
      ],
    ],
    res: [
      [
        "Informes con correcciones o descartes anotados",
        ({ state }) => state.apps.filter((a) => a.report && String(a.hallazgos || "").trim()).length,
      ],
    ],
  },
];
