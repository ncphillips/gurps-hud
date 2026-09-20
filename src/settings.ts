import { t } from "./i18n";

/**
 * The HUD's own settings: how big the strip is drawn, and which palette it is drawn in.
 *
 * Both are published to the stylesheet rather than threaded through the components, because both
 * are read in more places than the strip -- the size by the padding that lifts Foundry's player
 * list clear of it, the palette by every colour in `gurps-hud.css`.
 */

const MODULE = "gurps-hud";

/** The setting key, so `game.settings.get(MODULE, SIZE_SETTING)` and the registration agree. */
export const SIZE_SETTING = "size";

/** The setting key, so `game.settings.get(MODULE, THEME_SETTING)` and the registration agree. */
export const THEME_SETTING = "theme";

/** The custom property `gurps-hud.css` multiplies the UI scale by. */
const SCALE_VAR = "--gurps-hud-scale";

/** The attribute `gurps-hud.css` hangs the light palette off. */
const THEME_ATTR = "data-hud-theme";

/**
 * What each size scales the strip by.
 *
 * The ladder is lopsided, and the mock's own type is why. Its smallest text -- the `MELEE` and
 * `RANGED` column headings -- is set at 8px, which is already the floor, so the strip has far more
 * room to grow than to shrink:
 *
 *   small (0.9)    585x173. Headings at 7.2px; below this they stop being readable at all.
 *   medium (1)     650x192. The mock, pixel for pixel, on the 1280x713 it was drawn for.
 *   large (1.5)    975x287. Headings at 12px, and 38% of a 2560 canvas rather than 25%.
 *
 * Large is the size that earns the setting. Everything in the strip is laid out in fixed pixels, so
 * on a big canvas the 8px headings stay 8px however much room is going spare; 1.5 is the difference
 * between squinting at them and reading them. Small is only ever modest relief -- on the 1024x768
 * Foundry floors at, it takes the strip from 63% of the width to 57%, and going further would cost
 * legibility rather than buy space.
 */
export const HUD_SCALES = {
  small: 0.9,
  medium: 1,
  large: 1.5,
} as const;

export type HudSize = keyof typeof HUD_SCALES;

function isHudSize(size: unknown): size is HudSize {
  return typeof size === "string" && size in HUD_SCALES;
}

/** Anything the catalogue does not name reads as medium, which is the strip as designed. */
export function hudScale(size: unknown): number {
  return isHudSize(size) ? HUD_SCALES[size] : HUD_SCALES.medium;
}

/**
 * Publishes the size as a custom property on the document, rather than on the HUD's own element:
 * the strip's transform is not its only reader. `#ui-left` is padded clear of the strip by its
 * measured height, and that height has to be scaled by the same number or the player list sits
 * behind a large strip and floats above a small one.
 */
export function applyHudSize(size: unknown): void {
  document.documentElement.style.setProperty(SCALE_VAR, String(hudScale(size)));
}

/**
 * The palettes, in the order the setting offers them.
 *
 * `system` is not a palette: it is a deferral to `prefers-color-scheme`, resolved here so the
 * stylesheet only ever has the two to write. Dark is first because dark is what the strip was drawn
 * in -- `design-handoff/` is a dark mock, and every colour in `@theme` is its colour.
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
 * Publishes the palette as an attribute on the document, beside the size's custom property and for
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

export function registerSettings(): void {
  game.settings!.register(MODULE, SIZE_SETTING, {
    name: t("settings.size.name"),
    hint: t("settings.size.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: {
      small: t("settings.size.small"),
      medium: t("settings.size.medium"),
      large: t("settings.size.large"),
    },
    default: "medium",
    onChange: (size) => applyHudSize(size),
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
}

export function currentHudSize(): HudSize {
  const size = game.settings?.get(MODULE, SIZE_SETTING);
  return isHudSize(size) ? size : "medium";
}

export function currentHudTheme(): HudTheme {
  const theme = game.settings?.get(MODULE, THEME_SETTING);
  return isHudTheme(theme) ? theme : "dark";
}
