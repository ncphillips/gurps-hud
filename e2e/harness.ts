import { expect, type Locator, type Page } from "@playwright/test";
import type { HotbarMode, HudTheme } from "../src/settings";

/** Who the harness has on its canvas; the parameters only hand out the roles. */
export type CastMember = "thor" | "goblin" | "dragon";

export type Panel = "attrs" | "skills" | "maneuver" | "posture" | "target" | "actor";

/**
 * The harness's query parameters, as a spec spells them. Each names the action it takes on the
 * scene, so the call reads as the state under test -- `{ selected_actor: "" }` is "nobody is
 * selected", not a missing value. `src/dev-harness/main.ts` is the reference for what each does.
 */
export interface HarnessParams {
  /**
   * Draws the strip at that multiple of its designed size, as the `gurps-hud.scale` setting does.
   * Omit for 1, which is the strip as designed.
   */
  hud_scale?: number;
  /**
   * Draws the strip in that palette, as the `gurps-hud.theme` setting does. Omit for dark, which is
   * the palette the mock was drawn in. `"system"` defers to `page.emulateMedia({ colorScheme })`.
   */
  hud_theme?: HudTheme;
  /**
   * Whose macro bar is on screen, as the `gurps-hud.hotbar` setting decides. Only the strip's own
   * footer is here to see: the harness has no `#hotbar` of Foundry's to keep or hide.
   */
  hud_hotbar?: HotbarMode;
  /** Puts a stand-in modifier bucket beside the strip, as the Game Aid's is adopted in a world. */
  show_bucket?: boolean;
  /** Who the strip is showing. Omit for Thor; `""` for nobody. */
  selected_actor?: CastMember | "";
  /** Who is targeted, so the TARGET pill lists their hit locations. */
  target_actor?: CastMember;
  /** Puts the selected actor in the active combat performing this maneuver. */
  set_maneuver?: string;
  /** Opens that hover panel on load. */
  hover_panel?: Panel;
  /** Opens that pool's box for editing. */
  edit_pool?: "hp" | "fp";
  /** Expands the macro footer's library of all five hotbar pages. */
  expand_macros?: boolean;
  /** `"none"` leaves every attack unpicked, which is the state a fresh actor starts in. */
  pick_attacks?: "none";
  /** Opens a stand-in character sheet for that cast member, whose attack rows can be dragged. */
  open_sheet?: CastMember;
  /** Which hotbar page the number keys address. */
  set_macro_page?: number;
  /** Makes writing to an actor take a round trip, so the HUD reads a stale flag while it is in flight. */
  delay_writes?: boolean;
  /** Appends a `<pre id="measurements">` of key bounding boxes. */
  measure?: boolean;
}

/*
 * Only the maneuver popover carries a `data-hud-panel` hook, so every other panel is waited on by
 * something only it renders. Without this a `?hover_panel=` other than the maneuver would open and
 * be measured -- or scanned -- before it was on screen, and report that everything is fine.
 */
const PANEL_READY: Partial<Record<Panel, (page: Page) => Locator>> = {
  attrs: (page) => page.getByText("BASIC ATTRIBUTES"),
  skills: (page) => page.getByRole("button", { name: /Survival \(Woodlands\)/ }),
  target: (page) => page.getByRole("button", { name: /Vitals/ }),
  posture: (page) => page.getByRole("button", { name: "Crouching" }),
  actor: (page) => page.getByRole("button", { name: "Goblin Grunt" }),
};

/**
 * Opens the harness and waits for the HUD to have settled: the self-hosted fonts loaded, and the
 * panel named in `params` actually on screen. Both waits matter to anything that measures --
 * a box measured in the fallback font is a different width, and `Locator.evaluateAll` does not
 * auto-wait, so it will happily measure nothing at all and report that everything is fine.
 */
export async function openHarness(page: Page, params: HarnessParams = {}): Promise<void> {
  const query = new URLSearchParams(
    Object.entries(params).map(([name, value]) => [name, String(value)]),
  ).toString();

  await page.goto(query ? `?${query}` : "");
  await page.evaluate(() => document.fonts.ready);

  if (params.hover_panel) {
    const ready = PANEL_READY[params.hover_panel];
    await expect(
      ready ? ready(page) : page.locator(`[data-hud-panel="${params.hover_panel}"]`),
    ).toBeVisible();
  }

  if (params.expand_macros) {
    await expect(page.locator("[data-hud-macro-library]")).toBeVisible();
  }

  if (params.edit_pool) {
    await expect(page.getByRole("textbox")).toBeVisible();
  }
}
