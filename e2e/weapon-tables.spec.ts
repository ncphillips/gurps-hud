import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { openHarness } from "./harness";

/*
 * Issue #24: a pistol's "160/1,800" is more than twice the width of a thrown spear's "9/13", and
 * the column was drawn for the spear -- so the value painted over the rate of fire beside it.
 *
 * Only a browser can answer whether a value fits the box it is painted in: the width of nine
 * characters of the readout is a question about layout and a loaded font, not about markup.
 */

/** How much of a cell's value is painted outside it. Zero is a value the reader can read whole. */
function spill(cell: Locator): Promise<number> {
  return cell.evaluate((el) => el.scrollWidth - el.clientWidth);
}

function width(cell: Locator): Promise<number> {
  return cell.evaluate((el) => el.getBoundingClientRect().width);
}

const RIFLE = "system.ranged.00000";

test.describe("the range column", () => {
  test("a rifle's 800/3,500", async ({ page }) => {
    await openHarness(page, { selected_actor: "gunner" });

    expect(await spill(page.locator(`[data-hud-attack="${RIFLE}"] [data-hud-range]`))).toBe(0);
  });

  /* A column that widened only its values would leave the heading standing over the one beside it. */
  test("the heading over a widened column", async ({ page }) => {
    await openHarness(page, { selected_actor: "gunner" });

    expect(await width(page.locator("[data-hud-range-heading]"))).toBe(
      await width(page.locator(`[data-hud-attack="${RIFLE}"] [data-hud-range]`)),
    );
  });

  /* The strip is as wide as it has to be: a character who throws a spear is owed nothing extra. */
  test("a thrown spear's 9/13", async ({ page }) => {
    await openHarness(page);

    expect(await width(page.locator("[data-hud-range]"))).toBe(30);
  });
});
