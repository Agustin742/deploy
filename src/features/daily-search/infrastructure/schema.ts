import { boolean, foreignKey, mysqlTable, primaryKey, tinyint, varchar } from "drizzle-orm/mysql-core";
import { clientId, long, ownerId, position, short } from "../../../shared/db/schema/columns";

/** Search pages. The id of the built-in ones is a slug, custom ones use a client id. */
export const platforms = mysqlTable(
  "platforms",
  {
    userId: ownerId(),
    id: clientId(),
    name: short("name"),
    url: long("url"),
    custom: boolean("custom").notNull().default(false),
    position: position(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] })],
);

/** One row per checked day: month (YYYY-MM) x platform x day of month. */
export const searchChecks = mysqlTable(
  "search_checks",
  {
    userId: ownerId(),
    month: varchar("month", { length: 7 }).notNull(),
    platformId: clientId("platform_id"),
    day: tinyint("day").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.month, t.platformId, t.day] }),
    foreignKey({
      columns: [t.userId, t.platformId],
      foreignColumns: [platforms.userId, platforms.id],
      name: "search_checks_platform_fk",
    }).onDelete("cascade"),
  ],
);
