import { boolean, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { huge, long, ownerId, short } from "../../../shared/db/schema/columns";

/** One row per user: profile fields plus the weekly goal and review frequency. */
export const profiles = mysqlTable("profiles", {
  userId: ownerId().primaryKey(),
  name: short("name"),
  nameAuto: boolean("name_auto").notNull().default(true),
  shareName: boolean("share_name").notNull().default(false),
  headline: short("headline"),
  years: short("years"),
  english: short("english"),
  extraSkills: long("extra_skills"),
  cv: huge("cv"),
  goal: int("goal").notNull().default(0),
  goalSet: boolean("goal_set").notNull().default(false),
  revFreq: varchar("rev_freq", { length: 64 }).notNull().default(""),
});

/** Career base ("base" in the app state). */
export const careerBase = mysqlTable("career_base", {
  userId: ownerId().primaryKey(),
  activos: long("activos"),
  aspiraciones: long("aspiraciones"),
  mercado: long("mercado"),
  sintesis: long("sintesis"),
  objetivoLaboral: long("objetivo_laboral"),
});

/** Personal brand ("marca" in the app state). */
export const personalBrand = mysqlTable("personal_brand", {
  userId: ownerId().primaryKey(),
  promesa: long("promesa"),
  audiencia: long("audiencia"),
  historia: long("historia"),
  titular: long("titular"),
});
