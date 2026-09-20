import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openHarness, type HarnessParams } from "./harness";

/*
 * The HUD renders inside Foundry's own page, so a scan of the whole document would report on
 * Foundry's markup as much as ours. Every scan is anchored to the strip instead.
 */
const STRIP = "#gurps-hud-persistent";

/*
 * Known violations of the strip as a whole, i.e. its accessibility to-do list. Each scan asserts
 * the exact list, so a new violation fails and so does fixing a listed one -- the list cannot
 * quietly rot. The per-component lists live beside the components, in `*.a11y.test.ts`.
 *
 * Contrast is excluded here and scanned on its own below, per palette rather than per selector --
 * the same failing ink shows up in dozens of cells, and it is one decision about the palette in
 * every one of them.
 */
const EXCEPTIONS = {
  rest: [] as string[],
  attrs: [] as string[],
  skills: [] as string[],
  maneuver: [] as string[],
  target: [] as string[],
  posture: [] as string[],
  actor: [] as string[],
  // The pool box turns into a bare <input> with nothing naming it. Tracked against the component
  // in PoolField.a11y.test.ts, which is where the fix goes.
  editing: ["label: input"],
  macros: [] as string[],
  nothingPicked: [] as string[],
  nothingSelected: [] as string[],
};

/** One line per violation -- `rule: selector` -- the same shape the component scans assert on. */
async function stripViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .include(STRIP)
    .disableRules(["color-contrast"])
    .analyze();

  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

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

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.rest);
  });

  test("the attributes panel open", async ({ page }) => {
    await openHarness(page, { hover_panel: "attrs" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.attrs);
  });

  test("the skills panel open", async ({ page }) => {
    await openHarness(page, { hover_panel: "skills" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.skills);
  });

  test("the maneuver panel open", async ({ page }) => {
    await openHarness(page, { set_maneuver: "attack", hover_panel: "maneuver" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.maneuver);
  });

  test("the targeted token's hit locations open", async ({ page }) => {
    await openHarness(page, { target_actor: "goblin", hover_panel: "target" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.target);
  });

  test("the posture menu open", async ({ page }) => {
    await openHarness(page, { hover_panel: "posture" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.posture);
  });

  test("the character switcher open", async ({ page }) => {
    await openHarness(page, { hover_panel: "actor" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.actor);
  });

  test("a pool open for editing", async ({ page }) => {
    await openHarness(page, { edit_pool: "hp" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.editing);
  });

  test("the macro library expanded", async ({ page }) => {
    await openHarness(page, { expand_macros: true });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.macros);
  });

  test("an actor whose attacks have not been picked yet", async ({ page }) => {
    await openHarness(page, { pick_attacks: "none" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.nothingPicked);
  });

  test("nothing selected", async ({ page }) => {
    await openHarness(page, { selected_actor: "" });

    expect(await stripViolations(page)).toEqual(EXCEPTIONS.nothingSelected);
  });

  /*
   * Contrast, once per palette.
   *
   * Light mode is why this is a scan rather than the `fixme` it used to be: a second palette that
   * nobody measures is a second palette that quietly reads worse than the first. Both pass.
   *
   * A violation is recorded as the colour pair that caused it rather than the element that carried
   * it -- `#555556 on #16171b: 2.40:1, needs 4.5:1` -- and the sweep unions every state, because a
   * dim ink is one decision about the palette however many cells it is read in. That keeps a
   * failure something a designer can act on, and keeps it from churning every time a cell moves.
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
