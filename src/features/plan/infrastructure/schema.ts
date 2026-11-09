import { mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { clientId, dateText, long, ownerId, position, short } from "../../../shared/db/schema/columns";

/** Indicator variables selected for a week (key: Monday, YYYY-MM-DD). */
export const planWeekVars = mysqlTable(
  "plan_week_vars",
  {
    userId: ownerId(),
    week: varchar("week", { length: 10 }).notNull(),
    varId: varchar("var_id", { length: 128 }).notNull(),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.week, t.varId] })],
);

/** Targets ("metas" in the app state): key -> value. */
export const planTargets = mysqlTable(
  "plan_targets",
  {
    userId: ownerId(),
    targetKey: varchar("target_key", { length: 128 }).notNull(),
    value: long("value"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetKey] })],
);

export const objectives = mysqlTable(
  "objectives",
  {
    userId: ownerId(),
    id: clientId(),
    periodo: short("periodo"),
    semana: dateText("semana"),
    mes: dateText("mes"),
    variable: short("variable"),
    objetivo: long("objetivo"),
    valor: long("valor"),
    adapt: long("adapt"),
    recursos: long("recursos"),
    plazo: dateText("plazo"),
    prioridad: short("prioridad"),
    indicador: short("indicador"),
    tipoInd: short("tipo_ind"),
    meta: short("meta"),
    estado: short("estado"),
    doneAt: dateText("done_at"),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);
