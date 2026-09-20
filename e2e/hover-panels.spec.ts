import { expect, test } from "@playwright/test";
import { openHarness, type HarnessParams, type Panel } from "./harness";

/*
 * The hover panels are the one part of the strip whose correctness is pure geometry: a panel that
 * floats a few pixels clear of its trigger leaves a gap the pointer has to cross, and the trigger
 * dismisses on `mouseleave`. These drive the real pointer rather than the `?panel=` shortcut,
 * because the bug they guard against only exists between the two boxes.
 */
test.describe("hover panels", () => {
  test("the skills panel is the mock's 400px, borders included", async ({ page }) => {
    await openHarness(page, { hover_panel: "skills" });
    const panel = page.locator('[data-hud-trigger="skills"] [data-hud-popover]');

    expect((await panel.boundingBox())!.width).toBe(400);
  });

  /*
   * Every panel the strip has, with whatever the harness needs to open it. Each floats a different
   * distance clear of a trigger in a different corner, and a gap left open anywhere is the same
   * bug -- so the claim is about all six rather than about whichever one it was first found on.
   */
  const BRIDGED: Array<[Panel, HarnessParams]> = [
    ["attrs", { hover_panel: "attrs" }],
    ["skills", { hover_panel: "skills" }],
    ["maneuver", { set_maneuver: "attack", hover_panel: "maneuver" }],
    ["posture", { hover_panel: "posture" }],
    ["target", { target_actor: "goblin", hover_panel: "target" }],
    ["actor", { hover_panel: "actor" }],
  ];

  for (const [panel, params] of BRIDGED) {
    test(`the ${panel} panel's bridge closes the gap to its trigger`, async ({ page }) => {
      await openHarness(page, params);
      const trigger = page.locator(`[data-hud-trigger="${panel}"]`);
      const bridge = trigger.locator("[data-hud-popover-bridge]");
      const popover = trigger.locator("[data-hud-popover]");

      const [b, p, t] = await Promise.all([
        bridge.boundingBox(),
        popover.boundingBox(),
        trigger.boundingBox(),
      ]);

      // The bridge spans exactly from the trigger's top edge up to the panel's bottom edge.
      expect([Math.round(b!.y + b!.height), Math.round(b!.y)]).toEqual([
        Math.round(t!.y),
        Math.round(p!.y + p!.height),
      ]);
    });
  }

  /*
   * The posture badge sits inside the portrait, below the character name, so the straight-line path
   * from badge to menu passes over the name trigger. Without the bridge the name takes the hover
   * and swaps in the character switcher, which put the posture menu out of reach entirely.
   */
  test("walking the pointer from the posture badge up to its menu keeps the menu", async ({
    page,
  }) => {
    await openHarness(page);
    const badge = page.getByTitle("Posture -- hover to change");
    const box = (await badge.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByRole("button", { name: "Crouching" })).toBeVisible();

    // One pixel at a time, slower than the 120ms dismiss delay tolerates without the bridge.
    for (let dy = 1; dy <= 30; dy++) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - dy);
      await page.waitForTimeout(15);
    }

    await expect(page.getByRole("button", { name: "Crouching" })).toBeVisible();
  });

  test("the character switcher does not steal the hover on the way", async ({ page }) => {
    await openHarness(page);
    const badge = page.getByTitle("Posture -- hover to change");
    const box = (await badge.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let dy = 1; dy <= 30; dy++) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - dy);
      await page.waitForTimeout(15);
    }

    await expect(page.getByRole("button", { name: "Goblin Grunt" })).toBeHidden();
  });
});
