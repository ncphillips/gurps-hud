import { defineConfig } from "vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/** Throwaway config for src/dev-harness -- renders the HUD outside Foundry for visual review. */
export default defineConfig({
  root: "src",
  base: "/modules/gurps-hud/",
  publicDir: false,
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: { port: 30099, open: false },
  plugins: [
    svelte({ configFile: path.resolve(import.meta.dirname, "svelte.config.js") }),
    tailwindcss(),
  ],
});
