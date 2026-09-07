import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

const FOOTER = "[data-hud-macro-bar]";
const LIBRARY = "[data-hud-macro-library]";
const SLOT = "[data-hud-macro-slot]";

/*
 * The footer can only ever show ten of the hotbar's fifty macros, so the library is what makes the
 * other forty reachable. Everything asserted here is a question only a layout engine answers:
 * whether fifty 22px slots still fall into five rows of ten, and whether the panel stays inside the
 * viewport it drops over.
 */
test.describe("macro library", () => {
  test("lists every slot on the hotbar", async ({ page }) => {
    await openHarness(page, { macros: "" });

    await expect(page.locator(`${LIBRARY} ${SLOT}`)).toHaveCount(50);
  });

  test("lays each page out as one row of ten", async ({ page }) => {
    await openHarness(page, { macros: "" });
    const rows = await page
      .locator(`${LIBRARY} ${SLOT}`)
      .evaluateAll(
        (slots) => new Set(slots.map((slot) => Math.round(slot.getBoundingClientRect().top))).size,
      );

    expect(rows).toBe(5);
  });

  /*
   * The panel is anchored to the footer at the very bottom of the screen and opens upwards, so the
   * only edge it can run off is the top of the viewport.
   */
  test("opens fully inside the viewport", async ({ page }) => {
    await openHarness(page, { macros: "" });
    const top = await page.locator(LIBRARY).evaluate((el) => el.getBoundingClientRect().top);

    expect(top).toBeGreaterThan(0);
  });

  test("clears the footer it opens above", async ({ page }) => {
    await openHarness(page, { macros: "" });
    const gap = await page.evaluate(() => {
      const library = document.querySelector("[data-hud-macro-library]")!.getBoundingClientRect();
      const footer = document.querySelector("[data-hud-macro-bar]")!.parentElement!;
      return footer.getBoundingClientRect().top - library.bottom;
    });

    expect(gap).toBeGreaterThanOrEqual(0);
  });

  /*
   * The strip is pixel-matched to the mock, and its width is set by whichever row is widest. The
   * footer gained page controls and an expand toggle, so it has to still be narrower than the rows
   * above it -- an overflowing footer would silently widen the whole HUD.
   */
  test("does not widen the strip", async ({ page }) => {
    await openHarness(page);
    const overflow = await page.locator(FOOTER).evaluate((bar) => {
      const footer = bar.parentElement!;
      return footer.scrollWidth - footer.clientWidth;
    });

    expect(overflow).toBe(0);
  });
});
