// Drizzle schema entry point (drizzle-kit reads this file). Auth tables live here;
// domain tables live with their feature and are re-exported for the migration.
// Relative imports on purpose: drizzle-kit does not resolve the path alias.
export * from "./auth-schema";
export * from "../../../features/profile/infrastructure/schema";
export * from "../../../features/new-offer/infrastructure/schema";
export * from "../../../features/app-shell/infrastructure/schema";
export * from "../../../features/applications/infrastructure/schema";
export * from "../../../features/daily-search/infrastructure/schema";
export * from "../../../features/plan/infrastructure/schema";
export * from "../../../features/registries/infrastructure/schema";
export * from "../../../features/access/infrastructure/schema";
