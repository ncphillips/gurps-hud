import { expect, type Locator, type Page } from "@playwright/test";

/*
 * Only the maneuver popover carries a `data-hud-panel` hook, so every other panel is waited on by
 * something only it renders. Without this a `?panel=` other than the maneuver would open and be
 * measured -- or scanned -- before it was on screen, and report that everything is fine.
 */
const PANEL_READY: Record<string, (page: Page) => Locator> = {
  attrs: (page) => page.getByText("BASIC ATTRIBUTES"),
  skills: (page) => page.getByRole("button", { name: /Survival \(Woodlands\)/ }),
  target: (page) => page.getByRole("button", { name: /Vitals/ }),
  posture: (page) => page.getByRole("button", { name: "Crouching" }),
  actor: (page) => page.getByRole("button", { name: "Goblin Grunt" }),
};

/**
 * Opens the harness and waits for the HUD to have settled: the self-hosted fonts loaded, and the
 * panel named in `params` actually on screen. Both waits matter to anything that measures --
 * a box measured in the fallback font is a different width, and `Locator.evaluateAll` does not
 * auto-wait, so it will happily measure nothing at all and report that everything is fine.
 */
export async function openHarness(page: Page, params: Record<string, string> = {}): Promise<void> {
  const query = new URLSearchParams(params).toString();
  await page.goto(query ? `?${query}` : "");
  await page.evaluate(() => document.fonts.ready);

  if (params.panel) {
    const ready = PANEL_READY[params.panel];
    await expect(
      ready ? ready(page) : page.locator(`[data-hud-panel="${params.panel}"]`),
    ).toBeVisible();
  }

  if (params.macros !== undefined) {
    await expect(page.locator("[data-hud-macro-library]")).toBeVisible();
  }
}
