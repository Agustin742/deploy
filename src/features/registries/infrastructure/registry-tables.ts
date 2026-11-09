import type { AnyMySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";
import { objectives } from "../../plan/infrastructure/schema";
import type { RegistryKey } from "../domain/registries";
import { employers, experiments, metrics, networkRecords, posts, restDays, reviews, timeLogs } from "./schema";

export type RegistryTable = MySqlTable & { userId: AnyMySqlColumn; id: AnyMySqlColumn; position: AnyMySqlColumn };

/** Registry key of the app state -> its table (objectives live in the plan feature's schema). */
export const REGISTRY_TABLES = {
  objetivos: objectives,
  red: networkRecords,
  posts,
  metricas: metrics,
  tiempos: timeLogs,
  revisiones: reviews,
  empleadores: employers,
  experimentos: experiments,
  descansos: restDays,
} satisfies Record<RegistryKey, RegistryTable>;
