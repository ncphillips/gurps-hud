import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openHarness } from "./harness";

/*
 * The theme setting is fourteen custom properties swapped on `<html>`, so nothing short of a browser
 * can say whether it took: no component names a colour, every one of them reads a variable.
 *
 * What is asserted is the ground the strip is drawn on rather than its exact hex, because the point
 * of the setting is light or dark -- the palette itself is free to be tuned without rewriting this.
 */
async function stripLuminance(page: Page): Promise<number> {
  const background = await page
    .locator("[data-hud-strip]")
    .evaluate((strip) => getComputedStyle(strip).backgroundColor);

  const [red, green, blue] = [...background.matchAll(/[\d.]+/g)].map(Number);
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

test.describe("the HUD theme", () => {
  test("draws the strip on a light ground in light mode", async ({ page }) => {
    await openHarness(page, { hud_theme: "light" });

    expect(await stripLuminance(page)).toBeGreaterThan(0.5);
  });

  test("draws the strip on a dark ground in dark mode", async ({ page }) => {
    await openHarness(page, { hud_theme: "dark" });

    expect(await stripLuminance(page)).toBeLessThan(0.5);
  });

  /* The mock is dark, so a reader who has never opened the settings keeps the strip as designed. */
  test("no theme chosen", async ({ page }) => {
    await openHarness(page);

    expect(await stripLuminance(page)).toBeLessThan(0.5);
  });

  test("takes the desktop's light scheme under system", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openHarness(page, { hud_theme: "system" });

    expect(await stripLuminance(page)).toBeGreaterThan(0.5);
  });

  /* Polled, not read once: the desktop's change reaches the page as an event, on its own schedule. */
  test("follows the desktop changing its mind under system", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await openHarness(page, { hud_theme: "system" });

    await page.emulateMedia({ colorScheme: "light" });

    await expect.poll(() => stripLuminance(page)).toBeGreaterThan(0.5);
  });

  test("ignores the desktop once a theme has been picked", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await openHarness(page, { hud_theme: "dark" });

    expect(await stripLuminance(page)).toBeLessThan(0.5);
  });
});
