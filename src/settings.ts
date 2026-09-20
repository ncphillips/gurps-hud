import { t } from "./i18n";

/**
 * The HUD's own settings.
 *
 * There is one: how big the strip is. Everything in it is laid out in fixed pixels against
 * `design-handoff/`, which was drawn for a 1280x713 canvas, so on a 2560-wide one the same strip is
 * a quarter of the screen and the 8px labels are unreadable. Rather than give every box a second
 * set of measurements, the whole strip is scaled -- one transform, the mock's proportions kept
 * exactly -- and this is the multiplier.
 */

const MODULE = "gurps-hud";

/** The setting key, so `game.settings.get(MODULE, SIZE_SETTING)` and the registration agree. */
export const SIZE_SETTING = "size";

/** The custom property `gurps-hud.css` multiplies the UI scale by. */
const SCALE_VAR = "--gurps-hud-scale";

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
}

export function currentHudSize(): HudSize {
  const size = game.settings?.get(MODULE, SIZE_SETTING);
  return isHudSize(size) ? size : "medium";
}
