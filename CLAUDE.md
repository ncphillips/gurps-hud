# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**GURPS HUD** (`id: gurps-hud`) is a FoundryVTT v14 module providing a clean, concise
heads-up display for GURPS 4e play.

- **System:** [`gurps`](https://github.com/crnormand/gurps) — "GURPS 4e Game Aid (Unofficial)".
  This module reads that system's actor data model; it is not system-agnostic. `npm run setup`
  clones the pinned version into `.reference/gurps` (gitignored) and `.claude/settings.json`
  grants it via `permissions.additionalDirectories` — read it to find the real shapes of
  `actor.system` (attributes, HP/FP, skills, melee/ranged) rather than guessing. The pin lives in
  `scripts/setup-reference.sh`; bump it in the same change that bumps the `relationships.systems`
  compatibility in `src/module.json`. A repo-wide search will not reach it — `.reference/` is
  gitignored — so name the path when you search it: `rg <pattern> .reference/gurps`.
- **Audience:** GM-first. HUDs should work for any hovered/selected token, including NPCs;
  player-character conveniences layer on later.

## Dev Workflow

`npm run harness` mounts the HUD against stub Foundry globals so it can be looked at without a
running world, at `http://localhost:30099/modules/gurps-hud/dev-harness/index.html`. Its whole cast —
Thor, a goblin, a dragon — is always on the canvas, and each query parameter *on that URL* names the
action it takes on that scene: `?hover_panel=attrs` opens a panel for screenshotting,
`?selected_actor=` selects nobody, `?measure=true` dumps bounding boxes. They are URL parameters, not
arguments to the npm script. `src/dev-harness/main.ts` lists them all, and `e2e/harness.ts` types
them for the specs.

`npm test` runs the unit project alone. `npm run test:e2e` drives the harness through Playwright, and
`npm run test:a11y` runs *both* halves of the accessibility suite — the Vitest `a11y` project and the
`chromium-a11y` Playwright one — which neither of the other two commands touches. `npm run check` is
`tsc --noEmit` plus `svelte-check`.

## Conventions

- One directory per HUD under `src/apps/`, containing its `*App.ts` (ApplicationV2 subclass
  extending `SvelteApp`, which sits beside those directories) and its `*.svelte` root component.
  Presentational pieces shared across HUDs — `Popover`, `Readout` — live in `src/ui/`.
- Svelte components use runes (`$state`, `$props`, `$effect`). Subscribe to Foundry hooks inside
  `$effect` and return a cleanup function that calls `Hooks.off`.
- `src/module.json` is the manifest source of truth; Vite copies it to `dist/module.json`. Its
  version is stamped by the release workflow, never hand-edited.
- Tailwind for layout and most styling. `src/styles/gurps-hud.css` is everything Tailwind classes
  can't express: the prefixed Tailwind `@import`s, the `@theme` palette, the light-theme block, the
  font faces, and overrides of Foundry's own selectors (e.g. `.window-content` padding).
- Every Tailwind utility carries the `hud:` prefix — `hud:flex`, `hud:hover:bg-hud-accent`, and the
  marker class `hud:group`. Unprefixed, Tailwind's scanner turns any word in the source (including
  prose in a comment) into a global class, and `.collapse` alone hid Foundry's own sidebar toggle.
  Theme variables are declared bare in `@theme` but emitted prefixed, so read them back as
  `var(--hud-color-hud-panel)`.
- No component names a colour. The palette is the `@theme` block's tokens, which `gurps-hud.css`
  re-declares under `[data-hud-theme="light"]`, so light mode is one block rather than a `dark:`
  variant on every class. Raised surfaces and hairlines are alphas of `hud-veil` — the token that
  was `white` while the HUD was dark-only — and the theme turns that whole ladder over at once.
  `applyHudTheme` in `src/settings.ts` is what resolves the reader's choice, `system` included, and
  writes the attribute. Quiet text is `hud-faint`, one rung pinned to the WCAG AA floor with a
  different alpha per theme — never a new `text-hud-ink/NN` beneath it, which the contrast scan in
  `e2e/persistent-hud.a11y.test.ts` will catch.
- Scope every CSS override to a `#gurps-hud-*` id or `.gurps-hud` class so we never leak styles
  into the rest of Foundry. Put overrides in `@layer base` — an unlayered rule outranks every
  Tailwind utility on the same element.
- No user-facing string is written inline: use `t("some.key")` from `@/i18n`. The catalogue rules
  live in `src/i18n/CLAUDE.md` and `src/lang/README.md`.
- Keep GURPS knowledge in `src/gurps/`. `game-aid.ts` is the only file that touches the `GURPS`
  global, and `hud-view.ts` is where the data-model quirks live: it turns the actor into a flat view
  model, and that is what gets unit tested. Components stay presentational.
- The weapon tables show only the attacks somebody picked. `src/gurps/attack-picks.ts` is the pure
  algebra over that list; a pick is the Game Aid's own key path (`system.melee.00000`), which is at
  once the drag payload the character sheet hands out, the row key `hud-view` builds, and what the
  `gurps-hud.attacks` actor flag stores. Keep those three spellings identical.
- `*.a11y.test.ts` scans assert an exact `EXCEPTIONS` list, so fixing a listed violation fails the
  scan too. See the `hud-a11y-tests` skill before touching them.
- Assertions only a browser can answer belong in `e2e/`, driving the harness rather than a live
  world — see `e2e/CLAUDE.md`.
- The HUD renders under `border-box`, so a fixed pixel width includes its own padding and borders.
  Parts of the strip are fixed and measured: the portrait block is a 143px column at every size,
  which is the box `e2e/hud-size.spec.ts` reads the size setting off. Open the harness with
  `?measure=true` before changing a fixed width.
- Hover states may only change `color`, `background-color` and `border-color`. Anything that gains a
  border on hover carries a 1px transparent border at rest, so hover can never move geometry.
