import { defineConfig, devices } from "@playwright/test";

/*
 * The suite drives the dev harness, not Foundry: the HUD mounted against stub globals on :30099.
 * That keeps these tests runnable in CI, where no Foundry world exists, and makes the fixtures --
 * which actor, which maneuver, which panel is open -- query parameters rather than world state.
 */
const HARNESS = "http://localhost:30099/modules/gurps-hud/dev-harness/index.html";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // On CI, annotations on the diff plus an HTML report uploaded as an artifact when it fails.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: HARNESS,
    trace: "on-first-retry",
    /*
     * Set only where the pinned Chromium cannot be downloaded and a pre-installed one has to stand
     * in for it -- see `.claude/hooks/session-start.sh`. Unset locally and in CI, where it means
     * "the build Playwright pins", which is the one we want.
     */
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH },
  },
  /*
   * Two groups, split by filename like the Vitest suites: `*.spec.ts` drives the HUD and asserts on
   * what it does, `*.a11y.test.ts` scans it with axe-core. Separate projects so a red axe scan
   * reads as an accessibility regression rather than a broken feature, and so `npm run test:a11y`
   * can run the accessibility group across both runners.
   */
  projects: [
    {
      name: "chromium",
      testIgnore: "**/*.a11y.test.ts",
      use: devices["Desktop Chrome"],
    },
    {
      name: "chromium-a11y",
      testMatch: "**/*.a11y.test.ts",
      use: devices["Desktop Chrome"],
    },
  ],
  webServer: {
    command: "npm run harness",
    url: HARNESS,
    // Locally the harness is often already up for eyeballing the design; reuse it rather than
    // fighting over the port.
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
});
