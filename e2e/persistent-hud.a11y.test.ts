import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openHarness } from "./harness";

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
 * Contrast is excluded here and tracked on its own below. It fails in ~40 places, nearly all of
 * them the design's deliberately dim secondary text -- hints, column headers, muted values -- so
 * folding it in would leave every other rule unguarded behind one permanently red test.
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
    await expect(page.getByRole("textbox")).toBeVisible();

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
   * Unskip once the palette's secondary inks have been decided against WCAG AA. It is a design
   * call, not a markup fix: the failing colours come from the mock the strip is matched to.
   */
  test.fixme("the strip meets AA contrast", async ({ page }) => {
    await openHarness(page, { set_maneuver: "attack", hover_panel: "maneuver" });
    const { violations } = await new AxeBuilder({ page })
      .include(STRIP)
      .withRules(["color-contrast"])
      .analyze();

    expect(violations).toEqual([]);
  });
});
