import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

const PANEL = '[data-hud-panel="maneuver"]';
const TILE = "[data-hud-maneuver]";

/*
 * The pill only opens the panel for a token in the active combat, which the harness models by
 * giving the actor a maneuver -- so every fixture here starts the actor on Attack.
 */
const IN_COMBAT = { maneuver: "attack", panel: "maneuver" };

test.describe("maneuver panel", () => {
  test("lists every maneuver the HUD offers", async ({ page }) => {
    await openHarness(page, IN_COMBAT);

    await expect(page.locator(`${PANEL} ${TILE}`)).toHaveCount(20);
  });

  test("heads the All-Out Attack and All-Out Defence groups", async ({ page }) => {
    await openHarness(page, IN_COMBAT);

    await expect(page.locator(`${PANEL} [data-hud-maneuver-heading]`)).toHaveText([
      "ALL-OUT ATTACK",
      "ALL-OUT DEFENCE",
    ]);
  });

  test("names the pill after the heading when a grouped maneuver is set", async ({ page }) => {
    await openHarness(page, { maneuver: "aoa_strong", panel: "maneuver" });

    await expect(page.locator('[data-hud-trigger="maneuver"]')).toContainText(
      "All-Out Attack (Strong)",
    );
  });

  test("clicking a tile sets that maneuver on the actor", async ({ page }) => {
    await openHarness(page, IN_COMBAT);
    await page.locator('[data-hud-maneuver="aod_block"]').click();

    await expect(page.locator('[data-hud-trigger="maneuver"]')).toContainText(
      "All-Out Defence (Block)",
    );
  });

  /*
   * The panel is meant to be read in one glance, so a tile is one line: the name, then its hint
   * beside it. Measuring that the hint starts where the name ends is the assertion -- comparing
   * heights would pass vacuously against a tile whose line-height computes to `normal`.
   */
  test("sets each tile's hint beside its name, not beneath it", async ({ page }) => {
    await openHarness(page, IN_COMBAT);
    const stacked = await page.locator(`${PANEL} ${TILE}`).evaluateAll((tiles) =>
      tiles
        .filter((tile) => {
          const [name, hint] = Array.from(tile.children).map((el) => el.getBoundingClientRect());
          return hint.left < name.right;
        })
        .map((tile) => tile.getAttribute("data-hud-maneuver")),
    );

    expect(stacked).toEqual([]);
  });

  /*
   * The hint is `truncate`d, so a column too narrow for it fails silently with an ellipsis rather
   * than by overflowing -- which means the panel's fixed width has to be checked against the text
   * it actually renders, in the real font, rather than reasoned about.
   */
  test("fits every tile's hint inside its column without clipping", async ({ page }) => {
    await openHarness(page, IN_COMBAT);
    const clipped = await page.locator(`${PANEL} ${TILE}`).evaluateAll((tiles) =>
      tiles
        .filter((tile) => {
          const hint = tile.children[1];
          return hint.scrollWidth > hint.clientWidth;
        })
        .map((tile) => tile.getAttribute("data-hud-maneuver")),
    );

    expect(clipped).toEqual([]);
  });
});
