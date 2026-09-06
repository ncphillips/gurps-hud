import { defineConfig } from "vite";
import path from "node:path";
import { copyFileSync, mkdirSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const moduleId = "gurps-hud";
const foundryUrl = "http://localhost:30000";

export default defineConfig(({ mode }) => ({
  root: "src",
  base: `/modules/${moduleId}/`,
  publicDir: false,
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    port: 30001,
    open: false,
    proxy: {
      [`^(?!/modules/${moduleId}/)`]: {
        target: foundryUrl,
        changeOrigin: true,
      },
      "/socket.io": { target: foundryUrl, ws: true },
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    minify: mode === "production",
    lib: {
      entry: path.resolve(import.meta.dirname, "src/module.ts"),
      formats: ["es"],
      fileName: () => "module.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "module.js",
        assetFileNames: "styles/[name][extname]",
      },
    },
  },
  plugins: [
    svelte({ configFile: path.resolve(import.meta.dirname, "svelte.config.js") }),
    tailwindcss(),
    {
      name: "copy-manifest",
      closeBundle() {
        const dist = path.resolve(import.meta.dirname, "dist");
        mkdirSync(dist, { recursive: true });
        copyFileSync(
          path.resolve(import.meta.dirname, "src/module.json"),
          path.resolve(dist, "module.json"),
        );
      },
    },
  ],
}));
