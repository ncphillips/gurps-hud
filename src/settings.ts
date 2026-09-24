import { t } from "./i18n";

/**
 * The HUD's own settings: how big the strip is drawn, which palette it is drawn in, and whose macro
 * bar is on screen.
 *
 * The first two are published to the stylesheet rather than threaded through the components, because
 * both are read in more places than the strip -- the scale by the padding that lifts Foundry's
 * player list clear of it, the palette by every colour in `gurps-hud.css`. The hotbar is not: it decides
 * what the strip renders and what the application does to Foundry's own furniture, so it is read
 * back through `currentHotbarMode` and announced on a hook.
 */

const MODULE = "gurps-hud";

/** The setting key, so `game.settings.get(MODULE, SCALE_SETTING)` and the registration agree. */
export const SCALE_SETTING = "scale";

/** The setting key, so `game.settings.get(MODULE, THEME_SETTING)` and the registration agree. */
export const THEME_SETTING = "theme";

/** The setting key, so `game.settings.get(MODULE, HOTBAR_SETTING)` and the registration agree. */
export const HOTBAR_SETTING = "hotbar";

/** The setting key, so `game.settings.get(MODULE, MINIMIZED_SETTING)` and the registration agree. */
export const MINIMIZED_SETTING = "minimized";

/** The setting key, so `game.settings.get(MODULE, POSITION_SETTING)` and the registration agree. */
export const POSITION_SETTING = "position";

/** The custom property `gurps-hud.css` multiplies the UI scale by. */
const SCALE_VAR = "--gurps-hud-scale";

/** The attribute `gurps-hud.css` hangs the light palette off. */
const THEME_ATTR = "data-hud-theme";

/** 1x: the strip as designed, the mock pixel for pixel on the 1280x713 it was drawn for. */
export const DEFAULT_HUD_SCALE = 1;

/**
 * The floor, and the mock's own type is what sets it. The smallest text in the strip -- the `MELEE`
 * and `RANGED` column headings -- is set at 8px, which is already the floor, so 0.9x puts them at
 * 7.2px and anything below stops being readable at all. Shrinking was never worth much anyway: on
 * the 1024x768 Foundry floors at, 0.9x takes the strip from 63% of the width to 57%.
 */
export const MIN_HUD_SCALE = 0.9;

/**
 * The ceiling, and growing is what earns the setting. Everything in the strip is laid out in fixed
 * pixels, so on a big canvas the 8px headings stay 8px however much room is going spare; 2x is the
 * difference between squinting at them and reading them, and still leaves the strip inside half of
 * a 2560 canvas.
 */
export const MAX_HUD_SCALE = 2;

/**
 * What the slider moves by. Everything in the strip is laid out in whole pixels against the mock,
 * and `zoom` re-runs that layout: on a tenth the 1px borders and the 8px headings land somewhere
 * predictable, where an arbitrary 1.07x rounds them inconsistently across the strip.
 */
export const HUD_SCALE_STEP = 0.1;

/**
 * The multiple a stored setting -- or a harness parameter -- amounts to, as `NaN` when it does not
 * amount to one. `Number` alone will not do: it reads both `null` and `""` as 0, and the reader who
 * has never opened the config is exactly the one handing over an absent value.
 */
function hudMultiple(scale: unknown): number {
  if (typeof scale === "number") return scale;

  return typeof scale === "string" && scale.trim() !== "" ? Number(scale) : NaN;
}

/**
 * The multiple `zoom` takes. Clamped here as well as in the slider -- the slider is not the only
 * writer, since a client setting is reachable from a macro or the console -- but deliberately not
 * rounded to the step, so an off-step multiple set that way still works.
 *
 * Anything that is not a multiple reads as the strip as designed. That includes the named sizes
 * this setting used to store, which is what a client upgrading across the change reads back.
 */
export function hudScale(scale: unknown): number {
  const multiple = hudMultiple(scale);
  if (!Number.isFinite(multiple)) return DEFAULT_HUD_SCALE;

  return Math.min(Math.max(multiple, MIN_HUD_SCALE), MAX_HUD_SCALE);
}

/**
 * Publishes the scale as a custom property on the document, rather than on the HUD's own element:
 * the strip's transform is not its only reader. `#ui-left` is padded clear of the strip by its
 * measured height, and that height has to be scaled by the same number or the player list sits
 * behind a large strip and floats above a small one.
 */
export function applyHudScale(scale: unknown): void {
  document.documentElement.style.setProperty(SCALE_VAR, String(hudScale(scale)));
}

/**
 * The palettes, in the order the setting offers them.
 *
 * `system` is not a palette: it is a deferral to `prefers-color-scheme`, resolved here so the
 * stylesheet only ever has the two to write. Dark is first because dark is what the strip was drawn
 * in: the design it comes from is a dark mock, and every colour in `@theme` is its colour.
 */
export const HUD_THEMES = ["dark", "light", "system"] as const;

export type HudTheme = (typeof HUD_THEMES)[number];

/** The two the stylesheet knows about, `system` having been asked and answered. */
export type ResolvedTheme = Exclude<HudTheme, "system">;

function isHudTheme(theme: unknown): theme is HudTheme {
  return typeof theme === "string" && (HUD_THEMES as readonly string[]).includes(theme);
}

/**
 * Which palette a choice comes out as. Anything the catalogue does not name reads as dark, and so
 * does a `system` nobody can answer: dark is the strip as designed, so it is what every unknown
 * falls back to rather than a light strip appearing unasked.
 */
export function resolveHudTheme(theme: unknown): ResolvedTheme {
  if (theme === "light" || theme === "dark") return theme;

  return globalThis.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * What the reader last asked for, as opposed to what that resolved to. Kept because `system` has to
 * be re-resolved whenever the desktop changes its mind, and by then the setting is out of reach in
 * the harness.
 */
let chosenTheme: HudTheme = "dark";

/**
 * Publishes the palette as an attribute on the document, beside the scale's custom property and for
 * the same reason: the strip is not the only thing drawn in it. Popovers are portalled, and the
 * stylesheet's own Foundry overrides sit outside the HUD element entirely.
 */
export function applyHudTheme(theme: unknown): void {
  chosenTheme = isHudTheme(theme) ? theme : "dark";
  document.documentElement.setAttribute(THEME_ATTR, resolveHudTheme(chosenTheme));
  watchColorScheme();
}

let colorSchemeQuery: MediaQueryList | null = null;

/** Re-reads `chosenTheme`, so under light or dark a desktop that changes its mind changes nothing. */
const onColorSchemeChange = () => applyHudTheme(chosenTheme);

/**
 * Follows the desktop for as long as the reader leaves the setting on `system`. A browser hands
 * back the same `MediaQueryList` for a given query every time, so this settles on one listener for
 * the life of the page rather than one per theme change.
 */
function watchColorScheme(): void {
  const query = globalThis.matchMedia?.("(prefers-color-scheme: light)") ?? null;
  if (query === colorSchemeQuery) return;

  colorSchemeQuery?.removeEventListener("change", onColorSchemeChange);
  colorSchemeQuery = query;
  query?.addEventListener("change", onColorSchemeChange);
}

/**
 * Whose macro bar is on screen.
 *
 * The strip carries one of its own and hid Foundry's the moment it appeared, which is the wrong
 * answer for a table that has furnished the stock hotbar or handed it to another module. `hud` is
 * how the strip has always behaved, `default` gives the bar back and leaves the strip without a
 * footer, and `both` keeps the two side by side.
 *
 * Each mode is also an answer about the Game Aid's modifier bucket. The system parks the bucket
 * beside `#hotbar` and nudges it on every resize, so the HUD can only place it by owning the node --
 * see `PersistentHudApp#adoptBucket`. Wherever the stock bar is on screen, the bucket belongs to the
 * bar rather than to us, so it is left exactly where the system put it.
 */
export const HOTBAR_MODES = ["hud", "default", "both"] as const;

export type HotbarMode = (typeof HOTBAR_MODES)[number];

function isHotbarMode(mode: unknown): mode is HotbarMode {
  return typeof mode === "string" && (HOTBAR_MODES as readonly string[]).includes(mode);
}

/** Anything the catalogue does not name reads as `hud`, which is the strip before the setting. */
export function resolveHotbarMode(mode: unknown): HotbarMode {
  return isHotbarMode(mode) ? mode : "hud";
}

/** Whether the strip draws its own macro footer. */
export function showsHudHotbar(mode: HotbarMode): boolean {
  return mode !== "default";
}

/** Whether Foundry's own hotbar is left on screen -- and with it, the modifier bucket. */
export function showsDefaultHotbar(mode: HotbarMode): boolean {
  return mode !== "hud";
}

/**
 * Fired with the new mode whenever the reader changes it. Foundry announces a *world* setting
 * through `updateSetting` and a client one not at all, so the two things that have to follow -- the
 * strip's footer and the modifier bucket -- hear about it here.
 */
export const HOTBAR_MODE_HOOK = "gurps-hud.hotbarMode";

/**
 * Fired with the new state whenever the strip is minimized or expanded. A client setting is
 * announced nowhere, and the strip is not the only writer -- the keybinding is another -- so the
 * strip hears about it here rather than trusting its own click.
 */
export const MINIMIZED_HOOK = "gurps-hud.minimized";

/**
 * Fired with the new spot -- `null` for docked -- whenever the strip is dropped somewhere or put
 * back. The strip is not the only thing that follows it: the application only lifts Foundry's
 * player list clear of the strip while the strip is docked beneath it.
 */
export const POSITION_HOOK = "gurps-hud.position";

/**
 * Where the reader dropped the strip, measured from the bottom-left of the screen to the bottom-left
 * of the HUD. The bottom rather than the top because that is the corner the strip grows away from: a
 * longer weapon table, or expanding a minimized strip, pushes the top up and leaves the rest put.
 */
export interface HudPosition {
  left: number;
  bottom: number;
}

export function registerSettings(): void {
  game.settings!.register(MODULE, SCALE_SETTING, {
    name: t("settings.scale.name"),
    hint: t("settings.scale.hint"),
    scope: "client",
    config: true,
    type: Number,
    range: { min: MIN_HUD_SCALE, max: MAX_HUD_SCALE, step: HUD_SCALE_STEP },
    default: DEFAULT_HUD_SCALE,
    onChange: (scale) => applyHudScale(scale),
  });

  game.settings!.register(MODULE, THEME_SETTING, {
    name: t("settings.theme.name"),
    hint: t("settings.theme.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      dark: t("settings.theme.dark"),
      light: t("settings.theme.light"),
      system: t("settings.theme.system"),
    },
    default: "dark",
    onChange: (theme) => applyHudTheme(theme),
  });

  game.settings!.register(MODULE, HOTBAR_SETTING, {
    name: t("settings.hotbar.name"),
    hint: t("settings.hotbar.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      hud: t("settings.hotbar.hud"),
      default: t("settings.hotbar.default"),
      both: t("settings.hotbar.both"),
    },
    default: "hud",
    onChange: (mode) => Hooks.callAll(HOTBAR_MODE_HOOK, resolveHotbarMode(mode)),
  });

  game.settings!.register(MODULE, MINIMIZED_SETTING, {
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
    onChange: (minimized) => Hooks.callAll(MINIMIZED_HOOK, isMinimized(minimized)),
  });

  game.settings!.register(MODULE, POSITION_SETTING, {
    scope: "client",
    config: false,
    type: String,
    default: "",
    onChange: (position) => Hooks.callAll(POSITION_HOOK, hudPosition(position)),
  });
}

/** The harness hands settings over as the query string spells them, so `"true"` counts too. */
function isMinimized(minimized: unknown): boolean {
  return minimized === true || minimized === "true";
}

/**
 * The spot a stored setting amounts to, or `null` -- docked -- when it amounts to none. Stored as
 * `left,bottom` rather than as an object, because a setting's type cannot be `null` and docked is
 * the empty string. A client setting is reachable from the console, so a value missing a coordinate
 * reads as never having been moved rather than as a strip at `NaN`.
 */
function hudPosition(position: unknown): HudPosition | null {
  if (typeof position !== "string") return null;

  const [left, bottom] = position
    .split(",")
    .map((part) => (part.trim() === "" ? NaN : Number(part)));
  return Number.isFinite(left) && Number.isFinite(bottom)
    ? { left: left as number, bottom: bottom as number }
    : null;
}

export function currentHudScale(): number {
  const scale = hudMultiple(game.settings?.get(MODULE, SCALE_SETTING));
  return Number.isFinite(scale) ? scale : DEFAULT_HUD_SCALE;
}

export function currentHudTheme(): HudTheme {
  const theme = game.settings?.get(MODULE, THEME_SETTING);
  return isHudTheme(theme) ? theme : "dark";
}

export function currentHotbarMode(): HotbarMode {
  return resolveHotbarMode(game.settings?.get(MODULE, HOTBAR_SETTING));
}

export function currentMinimized(): boolean {
  return isMinimized(game.settings?.get(MODULE, MINIMIZED_SETTING));
}

export function toggleMinimized(): Promise<unknown> {
  return game.settings!.set(MODULE, MINIMIZED_SETTING, !currentMinimized());
}

export function currentHudPosition(): HudPosition | null {
  return hudPosition(game.settings?.get(MODULE, POSITION_SETTING));
}

/** `null` puts the strip back where it docks. */
export function saveHudPosition(position: HudPosition | null): Promise<unknown> {
  return game.settings!.set(
    MODULE,
    POSITION_SETTING,
    position ? `${position.left},${position.bottom}` : "",
  );
}
