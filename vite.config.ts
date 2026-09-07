import { defineConfig } from "vite";
import path from "node:path";
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
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
      name: "copy-static",
      closeBundle() {
        const dist = path.resolve(import.meta.dirname, "dist");
        mkdirSync(dist, { recursive: true });
        copyFileSync(
          path.resolve(import.meta.dirname, "src/module.json"),
          path.resolve(dist, "module.json"),
        );

        // Foundry loads the catalogues itself, from the paths `module.json` declares.
        const langSrc = path.resolve(import.meta.dirname, "src/lang");
        const langOut = path.resolve(dist, "lang");
        mkdirSync(langOut, { recursive: true });
        for (const file of readdirSync(langSrc).filter((name) => name.endsWith(".json"))) {
          copyFileSync(path.resolve(langSrc, file), path.resolve(langOut, file));
        }

        // The stylesheet references the fonts by their served module path rather than relatively,
        // because Vite's library build base64-inlines any asset a stylesheet resolves.
        const fontsSrc = path.resolve(import.meta.dirname, "src/styles/fonts");
        const fontsOut = path.resolve(dist, "styles/fonts");
        mkdirSync(fontsOut, { recursive: true });
        for (const file of readdirSync(fontsSrc)) {
          copyFileSync(path.resolve(fontsSrc, file), path.resolve(fontsOut, file));
        }
      },
    },
  ],
}));
