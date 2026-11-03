import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    // Cold jsdom + next/link imports can exceed the 5s default under parallel load.
    testTimeout: 20000,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
