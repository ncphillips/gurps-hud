import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { openHarness } from "./harness";

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("not on screen");
  return rect;
}

/* The harness goblin is reeling and exhausted at once, which is the longest condition label. */
test.describe("the condition cell, reeling and exhausted", () => {
  test("is as tall as a pool box", async ({ page }) => {
    await openHarness(page, { selected_actor: "goblin" });
    const condition = page.locator("[data-hud-condition-cell] > span");
    const hp = page.getByTitle("Hit Points -- click to edit");

    expect((await box(condition)).height).toBeCloseTo((await box(hp)).height, 0);
  });

  test("stays inside the portrait column", async ({ page }) => {
    await openHarness(page, { selected_actor: "goblin" });
    const condition = await box(page.locator("[data-hud-condition-cell] > span"));
    const column = await box(page.locator("[data-hud-portrait-block]"));

    expect(condition.x + condition.width).toBeLessThanOrEqual(column.x + column.width);
  });
});
