import AxeBuilder from "@axe-core/playwright";
import { test, type Page } from "@playwright/test";
import { expect } from "./a11y";
import { openHarness, type HarnessParams } from "./harness";

const STRIP = "#gurps-hud-persistent";

/**
 * One line per colour pair that failed, deduplicated -- a contrast failure is a fact about two
 * colours, not about the element they happened to meet on.
 */
async function contrastPairs(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .include(STRIP)
    .withRules(["color-contrast"])
    .analyze();

  return violations.flatMap((violation) =>
    violation.nodes.flatMap((node) =>
      node.any.map((check) => {
        const { fgColor, bgColor, contrastRatio, expectedContrastRatio } = check.data as {
          fgColor: string;
          bgColor: string;
          contrastRatio: number;
          expectedContrastRatio: string;
        };
        return `${fgColor} on ${bgColor}: ${contrastRatio.toFixed(2)}:1, needs ${expectedContrastRatio}`;
      }),
    ),
  );
}

/**
 * The palette's accessibility to-do list, empty in both themes and meant to stay that way.
 *
 * Every faint ink in the strip is one rung -- `--color-hud-faint` -- pinned to the floor AA puts
 * under 8px text, with an alpha per theme because dark clears that floor at 62% where light needs
 * 69%. So a colour added below it fails here rather than shipping, and the two lists sitting side
 * by side is what says neither palette has drifted behind the other.
 */
const CONTRAST_EXCEPTIONS: Record<"dark" | "light", string[]> = {
  dark: [],
  light: [],
};

test.describe("persistent HUD accessibility", () => {
  test("the strip at rest", async ({ page }) => {
    await openHarness(page);

    await expect(page).toBeAccessible();
  });

  test("the attributes panel open", async ({ page }) => {
    await openHarness(page, { hover_panel: "attrs" });

    await expect(page).toBeAccessible();
  });

  test("the skills panel open", async ({ page }) => {
    await openHarness(page, { hover_panel: "skills" });

    await expect(page).toBeAccessible();
  });

  test("the maneuver panel open", async ({ page }) => {
    await openHarness(page, { set_maneuver: "attack", hover_panel: "maneuver" });

    await expect(page).toBeAccessible();
  });

  test("the targeted token's hit locations open", async ({ page }) => {
    await openHarness(page, { target_actor: "goblin", hover_panel: "target" });

    await expect(page).toBeAccessible();
  });

  test("the posture menu open", async ({ page }) => {
    await openHarness(page, { hover_panel: "posture" });

    await expect(page).toBeAccessible();
  });

  test("the character switcher open", async ({ page }) => {
    await openHarness(page, { hover_panel: "actor" });

    await expect(page).toBeAccessible();
  });

  test("a pool open for editing", async ({ page }) => {
    await openHarness(page, { edit_pool: "hp" });

    // The pool box turns into a bare <input> with nothing naming it. Tracked against the
    // component in PoolField.a11y.test.ts, which is where the fix goes.
    await expect(page).toBeAccessible({ except: ["label: input"] });
  });

  test("the macro library expanded", async ({ page }) => {
    await openHarness(page, { expand_macros: true });

    await expect(page).toBeAccessible();
  });

  test("an actor whose attacks have not been picked yet", async ({ page }) => {
    await openHarness(page, { pick_attacks: "none" });

    await expect(page).toBeAccessible();
  });

  test("nothing selected", async ({ page }) => {
    await openHarness(page, { selected_actor: "" });

    await expect(page).toBeAccessible();
  });

  test("the strip minimized", async ({ page }) => {
    await openHarness(page, { hud_minimized: true });

    await expect(page).toBeAccessible();
  });

  test("the strip minimized under the default hotbar", async ({ page }) => {
    await openHarness(page, { hud_minimized: true, hud_hotbar: "default" });

    await expect(page).toBeAccessible();
  });

  /*
   * Contrast, once per palette: a palette nobody measures is one that quietly reads worse than the
   * other. The sweep unions every state, because a dim ink is one decision about the palette
   * however many cells it is read in -- which keeps the failure something a designer can act on,
   * and keeps it from churning every time a cell moves.
   */
  const STATES: HarnessParams[] = [
    {},
    { hover_panel: "attrs" },
    { hover_panel: "skills" },
    { set_maneuver: "attack", hover_panel: "maneuver" },
    { target_actor: "goblin", hover_panel: "target" },
    { hover_panel: "posture" },
    { hover_panel: "actor" },
    { edit_pool: "hp" },
    { expand_macros: true },
    { pick_attacks: "none" },
    { selected_actor: "" },
    { hud_minimized: true },
    { hud_minimized: true, hud_hotbar: "default" },
  ];

  for (const theme of ["dark", "light"] as const) {
    test(`the palette meets AA in ${theme} mode`, async ({ page }) => {
      test.slow();
      const pairs = new Set<string>();

      for (const state of STATES) {
        await openHarness(page, { ...state, hud_theme: theme });
        for (const pair of await contrastPairs(page)) pairs.add(pair);
      }

      expect([...pairs].sort()).toEqual(CONTRAST_EXCEPTIONS[theme]);
    });
  }
});
