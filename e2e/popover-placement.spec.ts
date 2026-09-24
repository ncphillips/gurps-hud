import { expect, test, type Page } from "@playwright/test";
import { openHarness, type HarnessParams } from "./harness";

/*
 * A docked strip has nothing below it and the whole canvas above, so its panels used to open
 * upward, always. A strip the reader has moved can be anywhere, so each panel now goes wherever
 * there is room for it -- and these check where that is, against the window, which only a browser
 * can measure.
 *
 * Wherever it goes, a panel hangs 6px off its own trigger, covering whatever else of the strip is
 * in the way. Held further off, the bridge that keeps the hover alive across the gap sat over the
 * name row's buttons: they showed through, but could not be pressed.
 */

/** Past every edge on purpose: the strip is kept on screen, so this is the window's top edge. */
const AT_TOP: HarnessParams["hud_position"] = "0,10000";
const AT_RIGHT: HarnessParams["hud_position"] = "10000,0";

async function boxes(page: Page, panel: string) {
  const [trigger, popover] = await Promise.all([
    page.locator(`[data-hud-trigger="${panel}"]`).boundingBox(),
    page.locator(`[data-hud-trigger="${panel}"] [data-hud-popover]`).boundingBox(),
  ]);
  return { trigger: trigger!, popover: popover! };
}

test.describe("popover placement", () => {
  test("docked, a panel opens 6px above its trigger", async ({ page }) => {
    await openHarness(page, { hover_panel: "skills" });
    const { trigger, popover } = await boxes(page, "skills");

    expect(Math.round(trigger.y - (popover.y + popover.height))).toBe(6);
  });

  test("docked, the posture menu opens 6px above its badge, over the name row", async ({
    page,
  }) => {
    await openHarness(page, { hover_panel: "posture" });
    const { trigger, popover } = await boxes(page, "posture");

    expect(Math.round(trigger.y - (popover.y + popover.height))).toBe(6);
  });

  test("moved to the top of the window, a panel opens 6px below its trigger", async ({ page }) => {
    await openHarness(page, { hud_position: AT_TOP, hover_panel: "skills" });
    const { trigger, popover } = await boxes(page, "skills");

    expect(Math.round(popover.y - (trigger.y + trigger.height))).toBe(6);
  });

  test("moved to the top of the window, the posture menu opens 6px below its badge", async ({
    page,
  }) => {
    await openHarness(page, { hud_position: AT_TOP, hover_panel: "posture" });
    const { trigger, popover } = await boxes(page, "posture");

    expect(Math.round(popover.y - (trigger.y + trigger.height))).toBe(6);
  });

  test("moved to the right of the window, the maneuver panel stays on screen", async ({ page }) => {
    await openHarness(page, {
      hud_position: AT_RIGHT,
      set_maneuver: "attack",
      hover_panel: "maneuver",
    });
    const { popover } = await boxes(page, "maneuver");

    expect(popover.x + popover.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  /* A 480px window with the strip in the middle leaves under 280px on either side of it. */
  test("with no room above or below, the skills list keeps below the window's top", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    await openHarness(page, { hud_position: "0,140", hover_panel: "skills" });
    const { popover } = await boxes(page, "skills");

    expect(popover.y).toBeGreaterThanOrEqual(0);
  });

  test("with no room above or below, the skills list keeps above the window's bottom", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 480 });
    await openHarness(page, { hud_position: "0,140", hover_panel: "skills" });
    const { popover } = await boxes(page, "skills");

    expect(popover.y + popover.height).toBeLessThanOrEqual(480);
  });

  test("at twice the size, a panel still opens above its trigger", async ({ page }) => {
    await openHarness(page, { hud_scale: 2, hover_panel: "skills" });
    const { trigger, popover } = await boxes(page, "skills");

    expect(popover.y + popover.height).toBeLessThan(trigger.y);
  });

  test("at twice the size, a panel keeps to its trigger's left edge", async ({ page }) => {
    await openHarness(page, { hud_scale: 2, hover_panel: "skills" });
    const [trigger, popover] = await Promise.all([
      page.locator('[data-hud-trigger="skills"]').boundingBox(),
      page.locator('[data-hud-trigger="skills"] [data-hud-popover]').boundingBox(),
    ]);

    expect(Math.round(popover!.x)).toBe(Math.round(trigger!.x));
  });

  test("moved to the top of the window, the bridge closes the gap below", async ({ page }) => {
    await openHarness(page, { hud_position: AT_TOP, hover_panel: "skills" });
    const trigger = page.locator('[data-hud-trigger="skills"]');
    const [b, p, t] = await Promise.all([
      trigger.locator("[data-hud-popover-bridge]").boundingBox(),
      trigger.locator("[data-hud-popover]").boundingBox(),
      trigger.boundingBox(),
    ]);

    expect([Math.round(b!.y), Math.round(b!.y + b!.height)]).toEqual([
      Math.round(t!.y + t!.height),
      Math.round(p!.y),
    ]);
  });
});
