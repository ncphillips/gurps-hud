import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openHarness } from "./harness";
import { hudScale, MAX_HUD_SCALE, MIN_HUD_SCALE } from "../src/settings";

/*
 * The scale setting is a single `zoom` on the strip, so nothing short of a browser can say whether
 * it took: every layout box inside the strip is identical at every scale, and only the painted
 * result differs.
 *
 * Measured on the portrait block, not on the strip itself, because the strip is `w-fit` and so is
 * as wide as its text. `zoom` re-runs layout at the new size, and glyph advances at 12px are not
 * exactly 1.5x those at 8px -- how far out depends on which font the machine actually has, which
 * was within 0.2% here and 1.2% on CI, enough to fail the assertion. The portrait block is a fixed
 * 143px column at every scale, so its painted width is the scale and nothing else. It has to be that
 * border box: anything inside it is 143px less a 1px border that `zoom` does not scale by the same
 * number, and that lone pixel is itself most of the tolerance.
 */
async function scaledWidth(page: Page): Promise<number> {
  const box = await page.locator("[data-hud-portrait-block]").boundingBox();
  if (!box) throw new Error("the portrait block is not on screen");
  return box.width;
}

test.describe("the HUD scale", () => {
  test("a multiple over 1", async ({ page }) => {
    await openHarness(page, { hud_scale: 1 });
    const designed = await scaledWidth(page);
    await openHarness(page, { hud_scale: 1.5 });

    expect((await scaledWidth(page)) / designed).toBeCloseTo(hudScale(1.5), 2);
  });

  /* The two ends the slider stops at, which are the sizes nobody can go past. */
  test("the ceiling", async ({ page }) => {
    await openHarness(page, { hud_scale: 1 });
    const designed = await scaledWidth(page);
    await openHarness(page, { hud_scale: MAX_HUD_SCALE });

    expect((await scaledWidth(page)) / designed).toBeCloseTo(hudScale(MAX_HUD_SCALE), 2);
  });

  test("the floor", async ({ page }) => {
    await openHarness(page, { hud_scale: 1 });
    const designed = await scaledWidth(page);
    await openHarness(page, { hud_scale: MIN_HUD_SCALE });

    expect((await scaledWidth(page)) / designed).toBeCloseTo(hudScale(MIN_HUD_SCALE), 2);
  });

  /*
   * The Game Aid's modifier bucket lives inside the HUD's element so it can sit beside the strip,
   * which puts it in reach of anything applied to that element. It is Foundry's, not the HUD's.
   */
  test("the adopted modifier bucket", async ({ page }) => {
    await openHarness(page, { show_bucket: true, hud_scale: 1 });
    const designed = await page.locator("#bucket-container").boundingBox();
    await openHarness(page, { show_bucket: true, hud_scale: 1.5 });

    expect(await page.locator("#bucket-container").boundingBox()).toEqual(designed);
  });

  test("no scale chosen", async ({ page }) => {
    await openHarness(page, { hud_scale: 1 });
    const designed = await scaledWidth(page);
    await openHarness(page);

    expect(await scaledWidth(page)).toBeCloseTo(designed, 0);
  });
});
