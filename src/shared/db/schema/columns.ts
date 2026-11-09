import { sql } from "drizzle-orm";
import { int, mediumtext, text, varchar } from "drizzle-orm/mysql-core";
import { user } from "./auth-schema";

/** Owner column: Better Auth user id, rows disappear with the user. */
export const ownerId = () =>
  varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

/** Client-generated id (`uid()`), only unique per user. */
export const clientId = (name = "id") => varchar(name, { length: 64 }).notNull();

/** Short free text or select-like value (never an enum: saved values can fall outside option lists). */
export const short = (name: string) => varchar(name, { length: 255 }).notNull().default("");

/** Date-like string (YYYY-MM-DD, YYYY-MM or empty). Wider than needed so odd legacy values still load. */
export const dateText = (name: string) => varchar(name, { length: 32 }).notNull().default("");

/** MySQL forbids literal defaults on TEXT/BLOB columns; an expression default ('') is allowed (8.0.13+, MariaDB 10.2.1+). */
const emptyText = sql`('')`;

/** Long free text. */
export const long = (name: string) => text(name).notNull().default(emptyText);

/** Very long free text (CV, job description, generated report). */
export const huge = (name: string) => mediumtext(name).notNull().default(emptyText);

/** Manual ordering inside a user's collection. */
export const position = () => int("position").notNull().default(0);
