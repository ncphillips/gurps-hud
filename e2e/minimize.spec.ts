import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

const ATTACK = "[data-hud-attack]";
const MACRO_BAR = "[data-hud-macro-bar]";

test.describe("minimizing the HUD", () => {
  /* The whole strip is how it has always looked, so a reader who never minimized it keeps it. */
  test("never minimized", async ({ page }) => {
    await openHarness(page);

    await expect(page.locator(ATTACK).first()).toBeVisible();
  });

  test("hides the weapon tables once minimized", async ({ page }) => {
    await openHarness(page);

    await page.getByRole("button", { name: "Minimize the HUD" }).click();

    await expect(page.locator(ATTACK)).toHaveCount(0);
  });

  test("brings the weapon tables back once expanded", async ({ page }) => {
    await openHarness(page, { hud_minimized: true });

    await page.getByRole("button", { name: "Expand the HUD" }).click();

    await expect(page.locator(ATTACK).first()).toBeVisible();
  });

  test("keeps the macro footer while minimized", async ({ page }) => {
    await openHarness(page, { hud_minimized: true });

    await expect(page.locator(MACRO_BAR)).toBeVisible();
  });

  /* A reader who kept Foundry's own bar has their macros there, so minimized is the tab alone. */
  test("has no macro footer while minimized under the default hotbar", async ({ page }) => {
    await openHarness(page, { hud_minimized: true, hud_hotbar: "default" });

    await expect(page.locator(MACRO_BAR)).toHaveCount(0);
  });

  test("puts the macros beside Expand rather than under it", async ({ page }) => {
    await openHarness(page, { hud_minimized: true });

    const tab = await page.getByRole("button", { name: "Expand the HUD" }).boundingBox();
    const bar = await page.locator(MACRO_BAR).boundingBox();

    expect(bar!.x).toBeGreaterThan(tab!.x + tab!.width);
  });

  /* The name row reads minimize, name, lock: the window control first, the character's own last. */
  test("puts Minimize before the character's name", async ({ page }) => {
    await openHarness(page);

    const minimize = await page.getByRole("button", { name: "Minimize the HUD" }).boundingBox();
    const name = await page.getByTitle(/^Thor Odinson/).boundingBox();

    expect(minimize!.x + minimize!.width).toBeLessThanOrEqual(name!.x);
  });

  test("puts the lock after the character's name", async ({ page }) => {
    await openHarness(page);

    const lock = await page.getByRole("button", { name: /lock the HUD/ }).boundingBox();
    const name = await page.getByTitle(/^Thor Odinson/).boundingBox();

    expect(lock!.x).toBeGreaterThanOrEqual(name!.x + name!.width);
  });

  /* The button that had focus is gone, and focus dropped to the body is focus a keyboard user has lost. */
  test("hands focus to Expand after minimizing", async ({ page }) => {
    await openHarness(page);

    await page.getByRole("button", { name: "Minimize the HUD" }).click();

    await expect(page.getByRole("button", { name: "Expand the HUD" })).toBeFocused();
  });

  test("hands focus back to Minimize after expanding", async ({ page }) => {
    await openHarness(page, { hud_minimized: true });

    await page.getByRole("button", { name: "Expand the HUD" }).click();

    await expect(page.getByRole("button", { name: "Minimize the HUD" })).toBeFocused();
  });
});
