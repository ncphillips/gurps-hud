import { defineConfig } from "vitest/config";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte({ configFile: path.resolve(import.meta.dirname, "svelte.config.js") })],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    // Component tests mount the client-side build of Svelte, not the SSR one.
    conditions: ["browser"],
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "jsdom",
    setupFiles: ["src/vitest-setup.ts"],
  },
});
