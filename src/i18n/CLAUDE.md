# i18n

No user-facing string is written inline. The HUD's own text lives in `src/lang/en.json` and is read
with `t("some.key")` from `@/i18n`, which is Foundry's `game.i18n` with the module id prefixed on.
`t` takes only keys the catalogue has, so a typo or a renamed key is a type error rather than a raw
key id rendered into the strip.

Catalogue keys are flat and prefixed -- `"gurps-hud.weapons.empty"` -- so the definition is greppable
from the call site, and because Foundry resolves a dotted key by walking its table, nesting the id and
then dotting beneath it would resolve to nothing in a world while still passing every test here.
`src/lang/README.md` is the translator-facing version of all this, including which strings are laid
out to a fixed width.

Anything the _system_ names -- posture labels, hit locations, maneuvers outside the HUD's menu -- is
not ours to translate: look it up through `localize` in `src/gurps/game-aid.ts` so it follows the Game
Aid's own languages.

Foundry owns the locale, and it is not there outside a world, so `src/i18n/stub.ts` stands in for
`game.i18n` in the harness and both Vitest projects. It reads the same `lang/en.json` that ships,
which is what makes a key missing from the catalogue fail a test rather than a live world.
