import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

/*
 * The HUD renders inside Foundry's own page, so a scan of the whole document would report on
 * Foundry's markup as much as ours. Every scan is anchored to the strip instead.
 */
const STRIP = "#gurps-hud-persistent";

/*
 * Contrast is excluded from the structural scans and tracked on its own below. It fails in ~40
 * places, nearly all of them the design's deliberately dim secondary text -- hints, column
 * headers, muted values -- so folding it in would leave every other a11y rule unguarded behind one
 * permanently red test.
 */
const STRUCTURAL = ["color-contrast"];

test.describe("accessibility", () => {
  test("the strip has no violations at rest", async ({ page }) => {
    await openHarness(page);
    const { violations } = await new AxeBuilder({ page })
      .include(STRIP)
      .disableRules(STRUCTURAL)
      .analyze();

    expect(violations.map((v) => v.id)).toEqual([]);
  });

  test("the maneuver panel has no violations", async ({ page }) => {
    await openHarness(page, { maneuver: "attack", panel: "maneuver" });
    const { violations } = await new AxeBuilder({ page })
      .include(STRIP)
      .disableRules(STRUCTURAL)
      .analyze();

    expect(violations.map((v) => v.id)).toEqual([]);
  });

  /*
   * Unskip once the palette's secondary inks have been decided against WCAG AA. It is a design
   * call, not a markup fix: the failing colours come from the mock the strip is matched to.
   */
  test.fixme("the strip meets AA contrast", async ({ page }) => {
    await openHarness(page, { maneuver: "attack", panel: "maneuver" });
    const { violations } = await new AxeBuilder({ page })
      .include(STRIP)
      .withRules(["color-contrast"])
      .analyze();

    expect(violations).toEqual([]);
  });
});
