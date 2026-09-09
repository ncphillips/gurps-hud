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
   * The strip is pixel-matched to the mock, and its width is set by whichever row is widest. Slots
   * sized to Foundry's own 32px controls make that row the footer for any actor whose weapons and
   * maneuver name are short, which is a deliberate trade: the footer sets the strip a minimum width
   * and the strip stops resizing as the GM clicks between tokens.
   *
   * What the footer may not do is creep. The ten slots are the row; the label, the page controls,
   * the library toggle and the gaps between them share a fixed budget, and a new control that
   * quietly widens the whole HUD is the regression this catches. `scrollWidth - clientWidth` cannot
   * find it: the strip is `w-fit`, so a footer too wide for its row widens the HUD rather than
   * overflowing anything.
   */
  const CHROME_BUDGET = 170;

  test("keeps its chrome inside a fixed budget", async ({ page }) => {
    await openHarness(page);
    const chrome = await page.locator(FOOTER).evaluate((bar) => {
      const footer = bar.parentElement!;
      return footer.getBoundingClientRect().width - bar.getBoundingClientRect().width;
    });

    expect(chrome).toBeLessThanOrEqual(CHROME_BUDGET);
  });
});
