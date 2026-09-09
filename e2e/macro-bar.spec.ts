import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

const SLOT = "[data-hud-macro-bar] [data-hud-macro-slot]";

/*
 * Foundry sizes every `.ui-control` -- the scene controls, the sidebar tabs -- to 32px, and the
 * stock hotbar's macros to 50px. The strip's slots take the smaller of the two: a macro's art has
 * to be recognisable at a glance, but the footer is one row of the strip and not a bar in its own
 * right. What the box actually measures is a question only a layout engine answers.
 */
const CONTROL_SIZE = 32;

test.describe("macro bar", () => {
  test("sizes each slot to Foundry's controls", async ({ page }) => {
    await openHarness(page);
    const box = await page
      .locator(SLOT)
      .first()
      .evaluate((slot) => {
        const { width, height } = slot.getBoundingClientRect();
        return { width, height };
      });

    expect(box).toEqual({ width: CONTROL_SIZE, height: CONTROL_SIZE });
  });

  test("keeps every slot on one row", async ({ page }) => {
    await openHarness(page);
    const rows = await page
      .locator(SLOT)
      .evaluateAll(
        (slots) => new Set(slots.map((slot) => Math.round(slot.getBoundingClientRect().top))).size,
      );

    expect(rows).toBe(1);
  });
});
