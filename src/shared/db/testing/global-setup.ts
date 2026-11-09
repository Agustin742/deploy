import path from "node:path";
import { MySqlContainer } from "@testcontainers/mysql";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createPool } from "mysql2/promise";
import type { TestProject } from "vitest/node";

// Must match the major version of the production MySQL (Hostinger). UNVERIFIED:
// confirm in hPanel and adjust the tag if it differs.
const MYSQL_IMAGE = "mysql:8.0";

declare module "vitest" {
  export interface ProvidedContext {
    testDatabaseUrl: string;
  }
}

/** One MySQL container per test run; migrations are applied once here. */
export default async function setup(project: TestProject) {
  const container = await new MySqlContainer(MYSQL_IMAGE)
    .withCommand([
      "--character-set-server=utf8mb4",
      "--collation-server=utf8mb4_0900_ai_ci",
    ])
    .start();

  const url = container.getConnectionUri();
  const pool = createPool({ uri: url, charset: "utf8mb4" });
  try {
    await migrate(drizzle(pool), {
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });
  } finally {
    await pool.end();
  }

  project.provide("testDatabaseUrl", url);
  return async () => {
    await container.stop();
  };
}
