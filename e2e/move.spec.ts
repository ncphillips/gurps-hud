import { expect, test, type Page } from "@playwright/test";
import { openHarness } from "./harness";

const GRIP = "[data-hud-grip]";
const STRIP = "[data-hud-strip]";

/** Presses the grip, moves the mouse by `(dx, dy)` and lets go. */
async function dragGrip(page: Page, dx: number, dy: number): Promise<void> {
  const grip = (await page.locator(GRIP).boundingBox())!;
  const x = grip.x + grip.width / 2;
  const y = grip.y + grip.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}

async function stripBox(page: Page) {
  return (await page.locator(STRIP).boundingBox())!;
}

test.describe("moving the HUD", () => {
  test("the grip is the strip's left edge", async ({ page }) => {
    await openHarness(page);

    const grip = (await page.locator(GRIP).boundingBox())!;
    const strip = await stripBox(page);

    // Inside the strip's 1px border.
    expect(grip.x).toBeLessThanOrEqual(strip.x + 1);
  });

  test("minimized", async ({ page }) => {
    await openHarness(page, { hud_minimized: true });

    await expect(page.locator(GRIP)).toBeVisible();
  });

  test("dragged to the right", async ({ page }) => {
    await openHarness(page);
    const before = await stripBox(page);

    await dragGrip(page, 200, -150);

    expect((await stripBox(page)).x).toBeCloseTo(before.x + 200, 0);
  });

  test("dragged upward", async ({ page }) => {
    await openHarness(page);
    const before = await stripBox(page);

    await dragGrip(page, 200, -150);

    expect((await stripBox(page)).y).toBeCloseTo(before.y - 150, 0);
  });

  test("dragged past the right of the window", async ({ page }) => {
    await openHarness(page);

    await dragGrip(page, 5000, -150);

    const strip = await stripBox(page);
    expect(strip.x + strip.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  });

  test("dragged past the top of the window", async ({ page }) => {
    await openHarness(page);

    await dragGrip(page, 200, -5000);

    expect((await stripBox(page)).y).toBeGreaterThanOrEqual(0);
  });

  /* The spot is the setting's, so it outlives the strip being redrawn in its other form. */
  test("minimized and expanded again after a drag", async ({ page }) => {
    await openHarness(page);
    await dragGrip(page, 200, -150);
    const moved = await stripBox(page);

    await page.getByRole("button", { name: "Minimize the HUD" }).click();
    await page.getByRole("button", { name: "Expand the HUD" }).click();

    expect((await stripBox(page)).x).toBeCloseTo(moved.x, 0);
  });

  test("opened where the reader left it", async ({ page }) => {
    await openHarness(page, { hud_position: "300,200" });

    expect((await stripBox(page)).x).toBeCloseTo(300, 0);
  });

  test("double-clicking the grip", async ({ page }) => {
    await openHarness(page);
    const docked = await stripBox(page);
    await dragGrip(page, 200, -150);

    await page.locator(GRIP).dblclick();

    expect((await stripBox(page)).x).toBeCloseTo(docked.x, 0);
  });
});
