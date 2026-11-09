import { mysqlTable } from "drizzle-orm/mysql-core";
import { huge, long, ownerId, short } from "../../../shared/db/schema/columns";

/** The unsaved new-offer form ("draft" in the app state). */
export const drafts = mysqlTable("drafts", {
  userId: ownerId().primaryKey(),
  empresa: short("empresa"),
  puesto: short("puesto"),
  link: long("link"),
  fuente: short("fuente"),
  estado: short("estado"),
  jd: huge("jd"),
});
