import { plazoObj } from "@/features/plan/domain/objectives";
import { varNames, varOpts } from "@/features/plan/domain/variables";
import type {
  AppState,
  Descanso,
  Empleador,
  Experimento,
  Metrica,
  Mods,
  ModKey,
  Objetivo,
  Post,
  RedRecord,
  Revision,
  Tiempo,
} from "@/features/state/domain/types";
import { fmtDate, MESES, mondayOf } from "@/shared/lib/dates";
import { uid } from "@/shared/lib/ids";

/** Shared option lists for select fields. */
export const OPC = {
  canal: ["LinkedIn", "Email", "Teléfono / videollamada", "Presencial", "Otro"],
  cres: ["Sin respuesta", "Respondió", "Reunión agendada", "Reunión hecha", "Referencia/derivación", "Cerrado"],
  nivel: ["Alta", "Media", "Baja"],
  pri: ["Alta", "Media", "Baja"],
  ost: ["Pendiente", "En curso", "Hecho", "Descartado"],
};

/** s select, d date, m month, a textarea, t text, n number, c checkbox. */
export type FieldType = "s" | "d" | "m" | "a" | "t" | "n" | "c";

export interface RegistryContext {
  state: AppState;
  today: string;
}

export interface FieldDef<T> {
  k: Extract<keyof T, string>;
  l: string;
  t: FieldType;
  p?: string;
  /** Fixed options or a function that depends on the item and the state. */
  o?: readonly string[] | ((it: T, ctx: RegistryContext) => string[]);
  show?: (it: T) => boolean;
  mod?: ModKey;
}

export interface RegistryDef<T> {
  def: (today: string) => Omit<T, "id">;
  f: FieldDef<T>[];
  title: (it: T) => string;
  sub?: (it: T) => string;
  sort?: (a: T, b: T) => number;
  empty: readonly [string, string];
}

export interface RegistryItems {
  objetivos: Objetivo;
  red: RedRecord;
  posts: Post;
  metricas: Metrica;
  tiempos: Tiempo;
  revisiones: Revision;
  empleadores: Empleador;
  experimentos: Experimento;
  descansos: Descanso;
}

export type RegistryKey = keyof RegistryItems;

const join = (parts: unknown[]): string => parts.filter(Boolean).join(" · ");
const LEVELS = ["Alta", "Media", "Baja"];

const objetivos: RegistryDef<Objetivo> = {
  def: (today) => ({
    periodo: "Semanal",
    semana: mondayOf(today),
    mes: today.slice(0, 7),
    variable: "",
    objetivo: "",
    valor: "",
    adapt: "",
    recursos: "",
    plazo: "",
    prioridad: "Media",
    indicador: "",
    tipoInd: "Actividad",
    meta: "",
    estado: "Pendiente",
    doneAt: "",
  }),
  f: [
    { k: "periodo", l: "Tipo de objetivo", t: "s", o: ["Semanal", "Mensual"] },
    { k: "semana", l: "Semana que empieza (lunes)", t: "d", show: (it) => it.periodo !== "Mensual" },
    { k: "mes", l: "Mes", t: "m", show: (it) => it.periodo === "Mensual" },
    { k: "variable", l: "Variable", t: "s", o: (it, ctx) => varOpts(ctx.state, it, ctx.today) },
    {
      k: "objetivo",
      l: "S · Específico: qué voy a hacer, cuándo y dónde",
      t: "a",
      p: "Ej. acciones concretas que dependan de mí",
    },
    { k: "valor", l: "M · Con sentido: qué valor mío expresa", t: "a" },
    { k: "adapt", l: "A · Adaptativo: cómo me acerca a una mejor vida laboral", t: "a" },
    { k: "recursos", l: "R · Realista: tiempo, energía y apoyos con los que cuento", t: "a" },
    { k: "plazo", l: "T · Plazo (se completa solo; podés cambiarlo)", t: "d" },
    { k: "prioridad", l: "Prioridad", t: "s", o: OPC.pri },
    { k: "indicador", l: "Indicador: cómo voy a saber que avanzó", t: "t" },
    { k: "tipoInd", l: "Tipo de indicador", t: "s", o: ["Actividad", "Resultado"] },
    { k: "meta", l: "Meta", t: "t" },
    { k: "estado", l: "Estado", t: "s", o: OPC.ost },
  ],
  title: (it) =>
    it.objetivo
      ? it.objetivo.length > 70
        ? it.objetivo.slice(0, 70) + "…"
        : it.objetivo
      : "Objetivo sin redactar",
  sub: (it) =>
    join([
      it.periodo === "Mensual"
        ? it.mes
          ? MESES[+it.mes.slice(5) - 1] + " " + it.mes.slice(0, 4)
          : ""
        : it.semana
          ? "Semana del " + fmtDate(it.semana)
          : "",
      it.variable,
      "Prioridad " + (it.prioridad || "").toLowerCase(),
      it.estado,
    ]),
  sort: (a, b) => {
    const stateOrder = (x: Objetivo) => ["En curso", "Pendiente", "Hecho", "Descartado"].indexOf(x.estado);
    const priorityOrder = (x: Objetivo) => LEVELS.indexOf(x.prioridad);
    const periodKey = (x: Objetivo) => (x.periodo === "Mensual" ? x.mes || "" : x.semana || "");
    return (
      periodKey(b).localeCompare(periodKey(a)) ||
      stateOrder(a) - stateOrder(b) ||
      priorityOrder(a) - priorityOrder(b)
    );
  },
  empty: ["Todavía no hay objetivos", "Escribí uno con el botón de arriba. Poné pocos y concretos."],
};

const red: RegistryDef<RedRecord> = {
  def: (today) => ({ fecha: today, conexiones: "", paginas: "", nota: "" }),
  f: [
    { k: "fecha", l: "Fecha del registro", t: "d" },
    { k: "conexiones", l: "Número en la red (conexiones)", t: "n" },
    { k: "paginas", l: "Número de páginas", t: "n" },
    { k: "nota", l: "Nota (opcional)", t: "t" },
  ],
  title: (it) => "Registro del " + fmtDate(it.fecha),
  sub: (it) => join([it.conexiones !== "" && it.conexiones + " conexiones", it.paginas !== "" && it.paginas + " páginas"]),
  empty: ["Sin registros todavía", "Anotá el número de conexiones y de páginas cada vez que lo quieras controlar."],
};

const posts: RegistryDef<Post> = {
  def: (today) => ({ fecha: today, tipo: "Publicación", tema: "", url: "", interacciones: "" }),
  f: [
    { k: "fecha", l: "Fecha", t: "d" },
    { k: "tipo", l: "Tipo", t: "s", o: ["Publicación", "Artículo", "Comentario", "Participación en comunidad"] },
    { k: "tema", l: "Tema", t: "t" },
    { k: "url", l: "Link (opcional)", t: "t" },
    { k: "interacciones", l: "Interacciones recibidas (opcional)", t: "n" },
  ],
  title: (it) => it.tema || it.tipo,
  sub: (it) => join([it.tipo, it.fecha && fmtDate(it.fecha)]),
  empty: ["Sin registros todavía", "Anotá cada publicación o participación en comunidades para ver tu semana."],
};

const metricas: RegistryDef<Metrica> = {
  def: (today) => ({
    fecha: today,
    fortaleza: "",
    conexiones: "",
    seguidores: "",
    vistas: "",
    interaccion: "",
    articulos: "",
    ssi: "",
    notas: "",
  }),
  f: [
    { k: "fecha", l: "Fecha de la medición", t: "d" },
    { k: "fortaleza", l: "Fortaleza del perfil", t: "t" },
    { k: "conexiones", l: "Conexiones", t: "n" },
    { k: "seguidores", l: "Seguidores", t: "n" },
    { k: "vistas", l: "Vistas del perfil", t: "n" },
    { k: "interaccion", l: "Interacción con el contenido", t: "t" },
    { k: "articulos", l: "Analítica de artículos", t: "t" },
    { k: "ssi", l: "Social Selling Index", t: "t" },
    { k: "notas", l: "Notas", t: "a" },
  ],
  title: (it) => "Medición del " + fmtDate(it.fecha),
  sub: () => "Valores copiados de tu cuenta de LinkedIn",
  empty: ["Sin mediciones", "Copiá desde LinkedIn los valores que te muestre tu cuenta. Esta página no se conecta con LinkedIn."],
};

const tiempos: RegistryDef<Tiempo> = {
  def: (today) => ({ fecha: today, actividad: "Postulaciones", est: "", real: "", nota: "" }),
  f: [
    { k: "fecha", l: "Fecha", t: "d" },
    { k: "actividad", l: "Actividad (variable)", t: "s", o: (_it, ctx) => varNames(ctx.state) },
    { k: "est", l: "Minutos estimados", t: "n" },
    { k: "real", l: "Minutos reales", t: "n" },
    { k: "nota", l: "Nota", t: "t" },
  ],
  title: (it) => it.actividad,
  sub: (it) =>
    join([
      it.fecha && fmtDate(it.fecha),
      it.est !== "" && "est. " + it.est + " min",
      it.real !== "" && "real " + it.real + " min",
    ]),
  empty: ["Sin bloques registrados", "Anotá cuánto pensabas que ibas a tardar y cuánto tardaste."],
};

const revisiones: RegistryDef<Revision> = {
  def: (today) => ({
    fecha: today,
    desde: "",
    hasta: "",
    avanzo: "",
    hice: "",
    aprendi: "",
    ajuste: "",
    no: "",
    aplicado: false,
  }),
  f: [
    { k: "fecha", l: "Fecha de la revisión", t: "d" },
    { k: "desde", l: "Período: desde", t: "d" },
    { k: "hasta", l: "Período: hasta", t: "d" },
    { k: "avanzo", l: "Qué avanzó (resultados)", t: "a" },
    { k: "hice", l: "Qué hice (actividad)", t: "a" },
    { k: "aprendi", l: "¿Qué me resultó más útil? (aprendizaje)", t: "a" },
    { k: "ajuste", l: "Qué voy a ajustar", t: "a" },
    { k: "no", l: "Si digo que sí a esto, ¿a qué le digo que no?", t: "a" },
    { k: "aplicado", l: "El ajuste ya se aplicó", t: "c" },
  ],
  title: (it) => "Revisión del " + fmtDate(it.fecha),
  sub: (it) => (it.desde && it.hasta ? `Período ${fmtDate(it.desde)} a ${fmtDate(it.hasta)}` : "Sin período"),
  empty: ["Sin revisiones todavía", "Revisá tu avance cada tanto y anotá qué ajustás."],
};

const empleadores: RegistryDef<Empleador> = {
  def: () => ({ empresa: "", quien: "", motivacion: "Media", posting: "Sin avisos", prioridad: "Media", notas: "" }),
  f: [
    { k: "empresa", l: "Empresa", t: "t" },
    { k: "quien", l: "¿Conocés a alguien ahí? (Advocacy)", t: "t" },
    { k: "motivacion", l: "¿Cuánto me interesa? (Motivation)", t: "s", o: OPC.nivel },
    {
      k: "posting",
      l: "Avisos actuales (Posting)",
      t: "s",
      o: ["Avisos relevantes", "Avisos poco relevantes", "Sin avisos"],
    },
    { k: "prioridad", l: "Prioridad (la definís vos)", t: "s", o: OPC.pri },
    { k: "notas", l: "Notas", t: "a" },
  ],
  title: (it) => it.empresa || "Empresa sin nombre",
  sub: (it) => `Prioridad ${it.prioridad.toLowerCase()} · interés ${it.motivacion.toLowerCase()}`,
  sort: (a, b) => LEVELS.indexOf(a.prioridad) - LEVELS.indexOf(b.prioridad),
  empty: ["Lista vacía", "Armá una lista finita de empleadores que te interesen."],
};

const experimentos: RegistryDef<Experimento> = {
  def: (today) => ({ rol: "", pregunta: "", accion: "", inicio: today, fin: "", aprendi: "", decision: "Pendiente" }),
  f: [
    { k: "rol", l: "Rol o campo que quiero probar", t: "t" },
    { k: "pregunta", l: "¿Qué quiero averiguar?", t: "a" },
    { k: "accion", l: "Experimento (algo pequeño y concreto)", t: "a" },
    { k: "inicio", l: "Inicio", t: "d" },
    { k: "fin", l: "Plazo", t: "d" },
    { k: "aprendi", l: "¿Qué aprendí?", t: "a" },
    { k: "decision", l: "Decisión", t: "s", o: ["Pendiente", "Seguir", "Ajustar", "Descartar"] },
  ],
  title: (it) => it.rol || "Experimento sin nombre",
  sub: (it) => join([it.decision, it.inicio && "desde " + fmtDate(it.inicio)]),
  sort: (a, b) => (b.inicio || "").localeCompare(a.inicio || ""),
  empty: ["Sin experimentos", "Probá un rol a pequeña escala antes de comprometerte con un cambio."],
};

const descansos: RegistryDef<Descanso> = {
  def: (today) => ({ fecha: today, nota: "", cumplido: false }),
  f: [
    { k: "fecha", l: "Día de descanso planificado", t: "d" },
    { k: "nota", l: "Nota", t: "t" },
    { k: "cumplido", l: "Lo cumplí", t: "c" },
  ],
  title: (it) => "Descanso del " + fmtDate(it.fecha),
  sub: (it) => (it.cumplido ? "Cumplido" : "Planificado"),
  empty: ["Sin descansos planificados", "Cuántos días: lo definís vos o tu coach."],
};

export const REGISTRIES: { [K in RegistryKey]: RegistryDef<RegistryItems[K]> } = {
  objetivos,
  red,
  posts,
  metricas,
  tiempos,
  revisiones,
  empleadores,
  experimentos,
  descansos,
};

/** Options of a select field, resolving the ones that depend on the item and the state. */
export function fieldOptions<T>(f: FieldDef<T>, it: T, ctx: RegistryContext): string[] {
  const o = f.o;
  return typeof o === "function" ? o(it, ctx) : o ? [...o] : [];
}

/** A field is shown when its module (if any) is enabled and its condition (if any) holds. */
export function isFieldVisible<T>(f: FieldDef<T>, it: T, mods: Mods): boolean {
  if (f.mod && !mods[f.mod]) return false;
  if (f.show && !f.show(it)) return false;
  return true;
}

/** Default values for a new item of a registry, without id. */
export const defaultItem = <K extends RegistryKey>(key: K, today: string): Omit<RegistryItems[K], "id"> =>
  REGISTRIES[key].def(today);

export interface CreateOptions {
  periodo?: "Semanal" | "Mensual";
  planWeek?: string | null;
}

/** New item with an id. Objectives get their period, week and deadline from the plan view. */
export function createRegistryItem<K extends RegistryKey>(
  key: K,
  today: string,
  opts: CreateOptions = {},
): RegistryItems[K] {
  const item = { id: uid(), ...defaultItem(key, today) } as RegistryItems[K];
  if (key === "objetivos") {
    const o = item as unknown as Objetivo;
    o.periodo = opts.periodo || "Semanal";
    o.semana = opts.planWeek || mondayOf(today);
    o.plazo = plazoObj(o, today);
  }
  return item;
}

/** Orders a registry like the original lists: custom order, else newest date first. */
export function sortRegistry<K extends RegistryKey>(key: K, items: RegistryItems[K][]): RegistryItems[K][] {
  const list = items.slice();
  const sort = REGISTRIES[key].sort as ((a: RegistryItems[K], b: RegistryItems[K]) => number) | undefined;
  if (sort) return list.sort(sort);
  if (list.length && (list[0] as { fecha?: string }).fecha !== undefined) {
    return list.sort((a, b) =>
      ((b as { fecha?: string }).fecha || "").localeCompare((a as { fecha?: string }).fecha || ""),
    );
  }
  return list;
}
