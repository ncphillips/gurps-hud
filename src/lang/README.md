# Translations

`en.json` is the HUD's own text. Foundry loads it from the paths `module.json` declares, so adding a
language is two steps and no code:

1. Copy `en.json` to `<lang>.json` and translate the values, leaving the keys alone.
2. Add it to `languages` in `src/module.json`:

   ```json
   { "lang": "de", "name": "Deutsch", "path": "lang/de.json" }
   ```

A partial file is fine -- Foundry loads English first and merges the active language over it, so any
key you leave out falls back rather than breaking.

## House rules

- **Keys are flat and carry the module id.** `"gurps-hud.weapons.empty"`, not a `weapons` object
  holding an `empty`. Foundry's translation table is shared by every module in the world, hence the
  prefix; flat means the definition is greppable from the `t("weapons.empty")` that uses it, and that
  a translation module overriding one key cannot clobber a whole subtree.
- **Placeholders are `{name}`**, filled by `game.i18n.format`. Keep every placeholder a string
  already has; drop one and it renders literally.
- Prefer a whole sentence per key over assembling one from fragments -- word order differs by
  language. `topBar.target.aimed` and `topBar.target.aimedWithPenalty` are two keys for that reason,
  rather than one with a penalty glued on the end.

## Things that will not fit

The strip is pixel-matched to `design-handoff/`, and some text is laid out to a fixed width:

- **`topBar.*.label`** are set in the mono face at 8-9px with wide tracking, in a row measured
  against the mock. A much longer word widens the strip.
- **`maneuvers.*.hint`** is `truncate`d to its column, so one that runs long is clipped with an
  ellipsis rather than wrapping. `e2e/maneuver-panel.spec.ts` checks this for English; run
  `npm run test:e2e` after translating and it will tell you which hints do not fit.
- **`condition.*.label`** is abbreviated on purpose -- it shares a cell with an icon. The matching
  `.title` is where the state gets spelled out.

## What does not belong here

Anything the **GURPS system** names: posture labels, hit locations, and the label of a maneuver
outside the HUD's own menu. Those ship with the GURPS 4e Game Aid and are looked up from its
translations at runtime (`localize` in `src/gurps/game-aid.ts`), so translating them here would
duplicate work already done in `crnormand/gurps/lang/`.
