import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openHarness } from "./harness";
import { HUD_SCALES } from "../src/settings";

/*
 * The size setting is a single transform on the strip, so nothing short of a browser can say
 * whether it took: every layout box inside the strip is identical at all three sizes, and only the
 * painted result differs.
 */
async function stripWidth(page: Page): Promise<number> {
  const box = await page.locator("[data-hud-strip]").boundingBox();
  if (!box) throw new Error("the strip is not on screen");
  return box.width;
}

test.describe("the HUD size", () => {
  test("large", async ({ page }) => {
    await openHarness(page, { hud_size: "medium" });
    const medium = await stripWidth(page);
    await openHarness(page, { hud_size: "large" });

    expect((await stripWidth(page)) / medium).toBeCloseTo(HUD_SCALES.large, 2);
  });

  test("small", async ({ page }) => {
    await openHarness(page, { hud_size: "medium" });
    const medium = await stripWidth(page);
    await openHarness(page, { hud_size: "small" });

    expect((await stripWidth(page)) / medium).toBeCloseTo(HUD_SCALES.small, 2);
  });

  /*
   * The Game Aid's modifier bucket lives inside the HUD's element so it can sit beside the strip,
   * which puts it in reach of anything applied to that element. It is Foundry's, not the HUD's.
   */
  test("the adopted modifier bucket", async ({ page }) => {
    await openHarness(page, { show_bucket: true, hud_size: "medium" });
    const medium = await page.locator("#bucket-container").boundingBox();
    await openHarness(page, { show_bucket: true, hud_size: "large" });

    expect(await page.locator("#bucket-container").boundingBox()).toEqual(medium);
  });

  test("no size chosen", async ({ page }) => {
    await openHarness(page, { hud_size: "medium" });
    const medium = await stripWidth(page);
    await openHarness(page);

    expect(await stripWidth(page)).toBeCloseTo(medium, 0);
  });
});
