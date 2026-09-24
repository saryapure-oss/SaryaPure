import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = path.dirname(new URL(import.meta.url).pathname);

// e2e/ holds Playwright specs (run via `npm run test:e2e`), not Vitest ones — without this exclude,
// `vitest run` tries to execute them under `test.describe` from @playwright/test and crashes.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
});
