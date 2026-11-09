import { boolean, foreignKey, json, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { clientId, dateText, huge, long, ownerId, position, short } from "../../../shared/db/schema/columns";

export const applications = mysqlTable(
  "applications",
  {
    userId: ownerId(),
    id: clientId(),
    fecha: dateText("fecha"),
    empresa: short("empresa"),
    puesto: short("puesto"),
    link: long("link"),
    fuente: short("fuente"),
    estado: short("estado"),
    respuesta: short("respuesta"),
    reclutador: short("reclutador"),
    contacto: short("contacto"),
    proximos: long("proximos"),
    comentarios: long("comentarios"),
    jd: huge("jd"),
    /** Derived matching result (MatchSuccess), kept as JSON because it is nested. */
    match: json("match"),
    report: huge("report"),
    revisado: boolean("revisado").notNull().default(false),
    hallazgos: long("hallazgos"),
    // Company profile ("ficha" in the domain).
    fichaIndustria: short("ficha_industria"),
    fichaTamano: short("ficha_tamano"),
    fichaModalidad: short("ficha_modalidad"),
    fichaValores: long("ficha_valores"),
    fichaCultura: long("ficha_cultura"),
    fichaNotas: long("ficha_notas"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

export const interviews = mysqlTable(
  "interviews",
  {
    userId: ownerId(),
    applicationId: clientId("application_id"),
    id: clientId(),
    fecha: dateText("fecha"),
    etapa: short("etapa"),
    preguntas: long("preguntas"),
    respondi: long("respondi"),
    prep: long("prep"),
    feedback: long("feedback"),
    aprendi: long("aprendi"),
    proximo: long("proximo"),
    position: position(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.applicationId, t.id] }),
    foreignKey({
      columns: [t.userId, t.applicationId],
      foreignColumns: [applications.userId, applications.id],
      name: "interviews_application_fk",
    }).onDelete("cascade"),
  ],
);

/** Per-application preparation checklist ("pre" in the domain): item key -> ok / note. */
export const applicationChecklist = mysqlTable(
  "application_checklist",
  {
    userId: ownerId(),
    applicationId: clientId("application_id"),
    itemKey: varchar("item_key", { length: 128 }).notNull(),
    ok: boolean("ok").notNull().default(false),
    txt: long("txt"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.applicationId, t.itemKey] }),
    foreignKey({
      columns: [t.userId, t.applicationId],
      foreignColumns: [applications.userId, applications.id],
      name: "application_checklist_application_fk",
    }).onDelete("cascade"),
  ],
);
