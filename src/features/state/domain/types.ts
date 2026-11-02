/**
 * Persisted application state. Keys and string values are the same ones the
 * original artifact saved in localStorage, so existing data loads unchanged.
 */

export interface Profile {
  name: string;
  nameAuto: boolean;
  shareName: boolean;
  headline: string;
  years: string;
  english: string;
  extraSkills: string;
  cv: string;
}

export interface Platform {
  id: string;
  name: string;
  url: string;
}

export interface MatchComponent {
  k: string;
  w: number;
  s: number | null;
  d: string;
}

export interface EnglishMatch {
  req: number;
  cv: number;
  status: "No requerido" | "Cumple" | "No cumple" | "Parcial";
}

export interface MatchSuccess {
  pct: number;
  comps: MatchComponent[];
  hardM: string[];
  hardX: string[];
  softM: string[];
  softX: string[];
  kwX: string[];
  eng: EnglishMatch;
  yr: number | null;
  yc: number | null | undefined;
  cumple: "Sí" | "Parcial" | "No";
  at: string;
}

export interface MatchError {
  err: "jd" | "cv";
}

export type MatchResult = MatchSuccess | MatchError;

export interface Interview {
  id: string;
  fecha?: string;
  etapa?: string;
  preguntas?: string;
  respondi?: string;
  prep?: string;
  feedback?: string;
  aprendi?: string;
  proximo?: string;
}

export interface CompanyProfile {
  industria: string;
  tamano: string;
  modalidad: string;
  valores: string;
  cultura: string;
  notas: string;
}

export interface Application {
  id: string;
  fecha: string;
  empresa: string;
  puesto: string;
  link: string;
  fuente: string;
  estado: string;
  respuesta: string;
  reclutador: string;
  contacto: string;
  proximos: string;
  comentarios: string;
  jd: string;
  match: MatchSuccess | null;
  report: string;
  entrevistas: Interview[];
  revisado: boolean;
  hallazgos: string;
  ficha: CompanyProfile;
  pre?: Record<string, { ok?: boolean; txt?: string }>;
}

export interface Draft {
  empresa: string;
  puesto: string;
  link: string;
  fuente: string;
  estado: string;
  jd: string;
}

export interface Mods {
  valores: boolean;
  marca: boolean;
  empleadores: boolean;
  seguimiento: boolean;
  informativas: boolean;
  experimentos: boolean;
  visibilidad: boolean;
  ia: boolean;
}

export type ModKey = keyof Mods;

export interface Objetivo {
  id: string;
  periodo: "Semanal" | "Mensual";
  semana: string;
  mes: string;
  variable: string;
  objetivo: string;
  valor: string;
  adapt: string;
  recursos: string;
  plazo: string;
  prioridad: string;
  indicador: string;
  tipoInd: string;
  meta: string;
  estado: string;
  doneAt: string;
}

export interface Contacto {
  id: string;
  [key: string]: unknown;
}

export interface RedRecord {
  id: string;
  fecha: string;
  conexiones: string;
  paginas: string;
  nota: string;
}

export interface Post {
  id: string;
  fecha: string;
  tipo: string;
  tema: string;
  url: string;
  interacciones: string;
}

export interface Tiempo {
  id: string;
  fecha: string;
  actividad: string;
  est: string;
  real: string;
  nota: string;
}

export interface Revision {
  id: string;
  fecha: string;
  desde: string;
  hasta: string;
  avanzo: string;
  hice: string;
  aprendi: string;
  ajuste: string;
  no: string;
  aplicado: boolean;
}

export interface Empleador {
  id: string;
  empresa: string;
  quien: string;
  motivacion: string;
  posting: string;
  prioridad: string;
  notas: string;
}

export interface Experimento {
  id: string;
  rol: string;
  pregunta: string;
  accion: string;
  inicio: string;
  fin: string;
  aprendi: string;
  decision: string;
}

export interface Metrica {
  id: string;
  fecha: string;
  fortaleza: string;
  conexiones: string;
  seguidores: string;
  vistas: string;
  interaccion: string;
  articulos: string;
  ssi: string;
  notas: string;
}

export interface Descanso {
  id: string;
  fecha: string;
  nota: string;
  cumplido: boolean;
}

export interface Base {
  activos: string;
  aspiraciones: string;
  mercado: string;
  sintesis: string;
  objetivoLaboral: string;
}

export interface Marca {
  promesa: string;
  audiencia: string;
  historia: string;
  titular: string;
}

export interface AppState {
  profile: Profile;
  apps: Application[];
  platforms: Platform[];
  /** month (YYYY-MM) -> platform id -> checked days of the month (1-31). */
  checks: Record<string, Record<string, number[]>>;
  goal: number;
  goalSet: boolean;
  draft: Draft;
  mods: Mods;
  objetivos: Objetivo[];
  contactos: Contacto[];
  red: RedRecord[];
  posts: Post[];
  tiempos: Tiempo[];
  revisiones: Revision[];
  empleadores: Empleador[];
  experimentos: Experimento[];
  metricas: Metrica[];
  descansos: Descanso[];
  metas: Record<string, string>;
  base: Base;
  marca: Marca;
  revFreq: string;
  /** week Monday (YYYY-MM-DD) -> selected indicator variable ids. */
  planVars: Record<string, string[]>;
}
