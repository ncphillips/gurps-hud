import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { openHarness } from "./harness";

/*
 * The gestures that curate the strip's attack list. All four are drag-and-drop or the layout it
 * produces, which is to say questions only a browser answers -- jsdom has no drag.
 *
 * Brent's rows, keyed as the GURPS sheet keys them.
 */
const SPEAR = "system.melee.00000";
const PUNCH = "system.melee.00001";
const KICK = "system.melee.00002";
const THROWN = "system.ranged.00000";

/** The picked attacks, top to bottom, which is the order the flag is holding them in. */
function picked(page: Page): Promise<string[]> {
  return page
    .locator("[data-hud-attack]")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("data-hud-attack") ?? ""));
}

function grip(page: Page, key: string) {
  return page.locator(`[data-hud-attack-handle="${key}"]`);
}

test.describe("picking attacks", () => {
  test("shows nothing until somebody says what to show", async ({ page }) => {
    await openHarness(page, { pick_attacks: "none" });

    expect(await picked(page)).toEqual([]);
  });

  test("adds every attack when the offer is taken", async ({ page }) => {
    await openHarness(page, { pick_attacks: "none" });
    await page.getByRole("button", { name: "Add every attack" }).click();

    expect(await picked(page)).toEqual([SPEAR, PUNCH, KICK, THROWN]);
  });

  test("takes an attack dragged off its own character's sheet", async ({ page }) => {
    await openHarness(page, { pick_attacks: "none", open_sheet: "brent" });
    await page
      .locator(`[data-harness-sheet-attack="${PUNCH}"]`)
      .dragTo(page.locator("[data-hud-attacks]"));

    expect(await picked(page)).toEqual([PUNCH]);
  });

  /* The whole point of stamping the sheet's actor id onto the payload: Bob's attacks, Greg's strip. */
  test("an attack dragged off another character's sheet", async ({ page }) => {
    await openHarness(page, { pick_attacks: "none", open_sheet: "goblin" });
    await page
      .locator("[data-harness-sheet-attack]")
      .first()
      .dragTo(page.locator("[data-hud-attacks]"));

    expect(await picked(page)).toEqual([]);
  });
});

test.describe("reordering attacks", () => {
  test("moves an attack ahead of the row it is dropped on", async ({ page }) => {
    await openHarness(page);
    await grip(page, KICK).dragTo(page.locator(`[data-hud-attack="${SPEAR}"]`));

    expect(await picked(page)).toEqual([KICK, SPEAR, PUNCH, THROWN]);
  });

  test("moves an attack down its group on Alt+ArrowDown", async ({ page }) => {
    await openHarness(page);
    await grip(page, SPEAR).focus();
    await page.keyboard.press("Alt+ArrowDown");

    expect(await picked(page)).toEqual([PUNCH, SPEAR, KICK, THROWN]);
  });

  /* Groups are separate lists; a melee attack has nowhere to land among the ranged ones. */
  test("a melee attack dropped on a ranged row", async ({ page }) => {
    await openHarness(page);
    await grip(page, KICK).dragTo(page.locator(`[data-hud-attack="${THROWN}"]`));

    expect(await picked(page)).toEqual([SPEAR, PUNCH, KICK, THROWN]);
  });
});

test.describe("removing attacks", () => {
  test("drops the attack dragged clear of the strip", async ({ page }) => {
    await openHarness(page);
    await grip(page, PUNCH).dragTo(page.locator("body"), { targetPosition: { x: 780, y: 60 } });

    expect(await picked(page)).toEqual([SPEAR, KICK, THROWN]);
  });

  /* A near miss inside the strip is a near miss, not a deletion. */
  test("an attack dropped on the strip but not on the tables", async ({ page }) => {
    await openHarness(page);
    await grip(page, PUNCH).dragTo(page.locator("[data-hud-macro-bar]"));

    expect(await picked(page)).toEqual([SPEAR, PUNCH, KICK, THROWN]);
  });

  test("removes the attack on Delete", async ({ page }) => {
    await openHarness(page);
    await grip(page, THROWN).focus();
    await page.keyboard.press("Delete");

    expect(await picked(page)).toEqual([SPEAR, PUNCH, KICK]);
  });

  /* Emptying the list is how the offer to fill it comes back -- there is no other reset. */
  test("offers to add them all again once the last one is gone", async ({ page }) => {
    await openHarness(page);
    for (const key of [SPEAR, PUNCH, KICK, THROWN]) {
      await grip(page, key).focus();
      await page.keyboard.press("Delete");
    }

    await expect(page.getByRole("button", { name: "Add every attack" })).toBeVisible();
  });
});
