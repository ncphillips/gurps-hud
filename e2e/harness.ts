import { expect, type Page } from "@playwright/test";

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
    await expect(page.locator(`[data-hud-panel="${params.panel}"]`)).toBeVisible();
  }
}
