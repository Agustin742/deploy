import type { RegistryItems, RegistryKey } from "@/features/registries/domain/registries";
import type { Application, Base, CompanyProfile, Draft, Interview, Marca, Mods, Profile } from "@/features/state/domain/types";

/**
 * Field allow-lists: the only names a client command may set, per entity.
 * `s` is a text value, `b` a boolean. The names are the domain property names,
 * which are also the Drizzle column keys, so a validated field can be handed to
 * a query builder as a key and is never turned into SQL text.
 */
export type FieldKind = "s" | "b";
export type FieldSpec = Readonly<Record<string, FieldKind>>;

type Spec<T> = { readonly [K in keyof T]-?: FieldKind };
type SpecWithoutId<T> = Spec<Omit<T, "id">>;

const text = <T extends string>(...keys: T[]) => Object.fromEntries(keys.map((k) => [k, "s"])) as Record<T, "s">;

export const PROFILE_FIELDS = {
  ...text("name", "headline", "years", "english", "extraSkills", "cv"),
  nameAuto: "b",
  shareName: "b",
} as const satisfies Spec<Profile>;

export const BASE_FIELDS = text("activos", "aspiraciones", "mercado", "sintesis", "objetivoLaboral") satisfies Spec<Base>;

export const BRAND_FIELDS = text("promesa", "audiencia", "historia", "titular") satisfies Spec<Marca>;

export const DRAFT_FIELDS = text("empresa", "puesto", "link", "fuente", "estado", "jd") satisfies Spec<Draft>;

export const MODULE_FIELDS = {
  valores: "b",
  marca: "b",
  empleadores: "b",
  seguimiento: "b",
  informativas: "b",
  experimentos: "b",
  visibilidad: "b",
  ia: "b",
} as const satisfies Spec<Mods>;

/** Plain application fields. `match`, `ficha`, `entrevistas` and `pre` have their own commands or sub-patches. */
export const APP_FIELDS = {
  ...text(
    "fecha",
    "empresa",
    "puesto",
    "link",
    "fuente",
    "estado",
    "respuesta",
    "reclutador",
    "contacto",
    "proximos",
    "comentarios",
    "jd",
    "report",
    "hallazgos",
  ),
  revisado: "b",
} as const satisfies Partial<Spec<Application>>;

export const FICHA_FIELDS = text("industria", "tamano", "modalidad", "valores", "cultura", "notas") satisfies Spec<CompanyProfile>;

export const INTERVIEW_FIELDS = text(
  "fecha",
  "etapa",
  "preguntas",
  "respondi",
  "prep",
  "feedback",
  "aprendi",
  "proximo",
) satisfies SpecWithoutId<Interview>;

/** Per-registry field lists, checked against the domain item types. */
export const REGISTRY_FIELDS = {
  objetivos: {
    ...text(
      "periodo",
      "semana",
      "mes",
      "variable",
      "objetivo",
      "valor",
      "adapt",
      "recursos",
      "plazo",
      "prioridad",
      "indicador",
      "tipoInd",
      "meta",
      "estado",
      "doneAt",
    ),
  },
  red: text("fecha", "conexiones", "paginas", "nota"),
  posts: text("fecha", "tipo", "tema", "url", "interacciones"),
  metricas: text("fecha", "fortaleza", "conexiones", "seguidores", "vistas", "interaccion", "articulos", "ssi", "notas"),
  tiempos: text("fecha", "actividad", "est", "real", "nota"),
  revisiones: {
    ...text("fecha", "desde", "hasta", "avanzo", "hice", "aprendi", "ajuste", "no"),
    aplicado: "b",
  },
  empleadores: text("empresa", "quien", "motivacion", "posting", "prioridad", "notas"),
  experimentos: text("rol", "pregunta", "accion", "inicio", "fin", "aprendi", "decision"),
  descansos: { ...text("fecha", "nota"), cumplido: "b" },
} as const satisfies { [K in RegistryKey]: SpecWithoutId<RegistryItems[K]> };

export const REGISTRY_KEYS = Object.keys(REGISTRY_FIELDS) as RegistryKey[];

/** Own-property lookup so names like `constructor` or `__proto__` never resolve. */
export const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
