import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(__dirname, "src"),
  // `server-only` throws outside Next's react-server condition; tests run on the server side.
  "server-only": path.resolve(__dirname, "src/shared/testing/server-only-stub.ts"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        // Fast, hermetic unit tests (no Docker).
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          // Server Functions (session + database) are replaced by fakes in unit tests.
          setupFiles: ["src/shared/testing/setup-unit.ts"],
          // Cold jsdom + next/link imports can exceed the 5s default under parallel load.
          testTimeout: 20000,
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "src/**/*.db.test.ts"],
        },
      },
      {
        // Database tests: one real MySQL container per run (Docker required).
        extends: true,
        test: {
          name: "db",
          environment: "node",
          include: ["src/**/*.db.test.ts"],
          globalSetup: ["src/shared/db/testing/global-setup.ts"],
          // All files share one database and truncate it between tests, so they must not overlap.
          fileParallelism: false,
          testTimeout: 30000,
          hookTimeout: 30000,
        },
      },
    ],
  },
});
