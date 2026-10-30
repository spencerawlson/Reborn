import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Each in-process Postgres (PGlite) takes a few seconds to start.
    testTimeout: 30_000,
  },
});
