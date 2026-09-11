import { defineConfig } from "vitest/config";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const svelteConfig = path.resolve(import.meta.dirname, "svelte.config.js");
const alias = { "@": path.resolve(import.meta.dirname, "src") };

/*
 * Two groups, split by filename: `*.test.ts` is logic and component behaviour in jsdom, and
 * `*.a11y.test.ts` is axe-core in a real headless Chromium. The a11y group needs the browser
 * because axe answers questions only a layout engine can -- computed colour, visibility,
 * focusability -- so `npm test` stays fast and `npm run test:a11y` pays for the browser.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [svelte({ configFile: svelteConfig })],
        resolve: {
          alias,
          // Component tests mount the client-side build of Svelte, not the SSR one.
          conditions: ["browser"],
        },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.a11y.test.ts"],
          environment: "jsdom",
          setupFiles: ["src/vitest-setup.ts"],
        },
      },
      {
        // Tailwind is in this project only: the a11y scans render against the real stylesheet,
        // which is where every colour and every `hidden` the rules care about comes from.
        plugins: [svelte({ configFile: svelteConfig }), tailwindcss()],
        resolve: { alias },
        test: {
          name: "a11y",
          include: ["src/**/*.a11y.test.ts"],
          setupFiles: ["src/a11y-setup.ts"],
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            screenshotFailures: false,
            // `launch.executablePath` is set only where the pinned Chromium cannot be downloaded
            // and a pre-installed one stands in -- see `.claude/hooks/session-start.sh`.
            instances: [
              {
                browser: "chromium",
                launch: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
              },
            ],
          },
        },
      },
    ],
  },
});
