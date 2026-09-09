import { expect, test } from "@playwright/test";
import { openHarness } from "./harness";

/*
 * The strip is always mounted, so the state a GM sees most -- nothing selected -- has to hold its
 * own shape rather than vanish. These drive the whole assembled strip because that is the claim:
 * it is on screen, it is still the same box, and the parts that need no actor still work.
 */
test.describe("the strip with nothing selected", () => {
  test("the strip is on screen", async ({ page }) => {
    await openHarness(page, { noActor: "" });

    await expect(page.getByText("Select Actor")).toBeVisible();
  });

  test("the macro bar is still usable", async ({ page }) => {
    await openHarness(page, { noActor: "" });

    await expect(page.locator('[data-hud-macro-slot="1"]')).toBeVisible();
  });

  test("the attack table asks for a character instead", async ({ page }) => {
    await openHarness(page, { noActor: "" });

    await expect(
      page.getByText("Select a token or a character to see their attacks."),
    ).toBeVisible();
  });
});
