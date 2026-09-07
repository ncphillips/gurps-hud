import en from "../lang/en.json";

/**
 * Foundry's `game.i18n`, for everything that runs without a world: the dev harness, the unit tests
 * and the a11y scans. It reads the same `lang/en.json` Foundry would load from the manifest, so the
 * text under test is the text that ships -- a key used by a component but missing from the catalogue
 * fails here rather than in a live world.
 *
 * This is dev-only and never reaches `dist`: nothing `src/module.ts` imports leads here.
 */

const CATALOGUE: Record<string, string> = en;

/**
 * @param extra Keys owned by the GURPS system rather than the HUD -- posture labels and the like --
 *   which in a real world come from the Game Aid's own translations.
 */
export function foundryI18n(extra: Record<string, string> = {}) {
  const localize = (key: string): string => extra[key] ?? CATALOGUE[key] ?? key;

  return {
    lang: "en",
    localize,
    format: (key: string, data: Record<string, unknown> = {}): string =>
      localize(key).replace(/\{(\w+)\}/g, (whole, name: string) =>
        name in data ? String(data[name]) : whole,
      ),
  };
}
