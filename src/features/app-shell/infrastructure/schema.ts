import { boolean, mysqlTable } from "drizzle-orm/mysql-core";
import { ownerId } from "../../../shared/db/schema/columns";

/** Optional modules switched on by the user ("mods" in the app state). */
export const userModules = mysqlTable("user_modules", {
  userId: ownerId().primaryKey(),
  valores: boolean("valores").notNull().default(false),
  marca: boolean("marca").notNull().default(false),
  empleadores: boolean("empleadores").notNull().default(false),
  seguimiento: boolean("seguimiento").notNull().default(false),
  informativas: boolean("informativas").notNull().default(false),
  experimentos: boolean("experimentos").notNull().default(false),
  visibilidad: boolean("visibilidad").notNull().default(false),
  ia: boolean("ia").notNull().default(false),
});
