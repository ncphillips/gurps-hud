import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

const HUD_FOOTER = "[data-hud-macro-bar]";

/*
 * The strip hid Foundry's hotbar the moment it appeared, which is the wrong answer for a table that
 * has furnished the stock bar or handed it to another module. Whether the strip draws a footer of
 * its own is the half of that setting a browser can answer; the other half -- hiding `#hotbar`, and
 * leaving the Game Aid's modifier bucket where the system parks it -- happens against Foundry's own
 * furniture, which the harness does not have, and is asserted in `src/settings.test.ts`.
 */
test.describe("the hotbar setting", () => {
  /* The footer is how the strip has always looked, so a reader who never opened the settings keeps it. */
  test("no hotbar chosen", async ({ page }) => {
    await openHarness(page);

    await expect(page.locator(HUD_FOOTER)).toBeVisible();
  });

  test("draws the strip's own macro footer under hud", async ({ page }) => {
    await openHarness(page, { hud_hotbar: "hud" });

    await expect(page.locator(HUD_FOOTER)).toBeVisible();
  });

  test("draws it under both, alongside the one Foundry keeps", async ({ page }) => {
    await openHarness(page, { hud_hotbar: "both" });

    await expect(page.locator(HUD_FOOTER)).toBeVisible();
  });

  test("leaves the strip without a footer under default", async ({ page }) => {
    await openHarness(page, { hud_hotbar: "default" });

    await expect(page.locator(HUD_FOOTER)).toHaveCount(0);
  });
});
