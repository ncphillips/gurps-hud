import type en from "../lang/en.json";

/**
 * The HUD's own strings, through Foundry's localization.
 *
 * The catalogue itself is `src/lang/en.json`, declared in `module.json` and loaded by Foundry, not
 * bundled -- which is what lets a translator add `lang/de.json` beside it, and lets a separate
 * translation module override any of these keys without touching this one.
 *
 * Every key carries the module id, because Foundry's translation table is shared by every module and
 * system in the world: an unprefixed `weapons.empty` would collide with somebody else's. `t` adds
 * the prefix, so a call site names the key the way the catalogue spells it after the id.
 */

const CATALOGUE = "gurps-hud";
type Catalogue = typeof CATALOGUE;

/**
 * Every key in the English catalogue, less the module id. Calling `t` with anything else is a type
 * error, so a renamed or deleted key cannot survive to runtime as the raw key id rendered into the
 * UI. The import is type-only: the JSON never reaches the bundle.
 */
type WithoutPrefix<T> = T extends `${Catalogue}.${infer Key}` ? Key : never;

export type TranslationKey = WithoutPrefix<keyof typeof en>;

/** Values substituted into a string's `{...}` placeholders. */
export type Interpolations = Record<string, string | number>;

export function t(key: TranslationKey, interpolations?: Interpolations): string {
  const id = `${CATALOGUE}.${key}`;
  if (!game.i18n) return id;

  return interpolations ? game.i18n.format(id, interpolations) : game.i18n.localize(id);
}
