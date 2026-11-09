import { boolean, index, mysqlTable, primaryKey } from "drizzle-orm/mysql-core";
import { clientId, dateText, long, ownerId, position, short } from "../../../shared/db/schema/columns";

export const networkRecords = mysqlTable(
  "network_records",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    conexiones: short("conexiones"),
    paginas: short("paginas"),
    nota: long("nota"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("network_records_date_idx").on(t.userId, t.fecha)],
);

export const posts = mysqlTable(
  "posts",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    tipo: short("tipo"),
    tema: long("tema"),
    url: long("url"),
    interacciones: short("interacciones"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("posts_date_idx").on(t.userId, t.fecha)],
);

export const timeLogs = mysqlTable(
  "time_logs",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    actividad: short("actividad"),
    est: short("est"),
    real: short("real"),
    nota: long("nota"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("time_logs_date_idx").on(t.userId, t.fecha)],
);

export const reviews = mysqlTable(
  "reviews",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    desde: dateText("desde"),
    hasta: dateText("hasta"),
    avanzo: long("avanzo"),
    hice: long("hice"),
    aprendi: long("aprendi"),
    ajuste: long("ajuste"),
    no: long("no"),
    aplicado: boolean("aplicado").notNull().default(false),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("reviews_date_idx").on(t.userId, t.fecha)],
);

export const employers = mysqlTable(
  "employers",
  {
    userId: ownerId(),
    id: clientId(),
    empresa: short("empresa"),
    quien: short("quien"),
    motivacion: long("motivacion"),
    posting: long("posting"),
    prioridad: short("prioridad"),
    notas: long("notas"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const experiments = mysqlTable(
  "experiments",
  {
    userId: ownerId(),
    id: clientId(),
    rol: short("rol"),
    pregunta: long("pregunta"),
    accion: long("accion"),
    inicio: dateText("inicio"),
    fin: dateText("fin"),
    aprendi: long("aprendi"),
    decision: short("decision"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const metrics = mysqlTable(
  "metrics",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    fortaleza: short("fortaleza"),
    conexiones: short("conexiones"),
    seguidores: short("seguidores"),
    vistas: short("vistas"),
    interaccion: short("interaccion"),
    articulos: short("articulos"),
    ssi: short("ssi"),
    notas: long("notas"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("metrics_date_idx").on(t.userId, t.fecha)],
);

export const restDays = mysqlTable(
  "rest_days",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    nota: long("nota"),
    cumplido: boolean("cumplido").notNull().default(false),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("rest_days_date_idx").on(t.userId, t.fecha)],
);
