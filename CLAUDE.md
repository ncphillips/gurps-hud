# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

**GURPS HUD** (`id: gurps-hud`) is a FoundryVTT v14 module providing a clean, concise
heads-up display for GURPS 4e play.

- **System:** [`gurps`](https://github.com/crnormand/gurps) — "GURPS 4e Game Aid (Unofficial)",
  currently 0.18.23 locally. This module reads that system's actor data model; it is not
  system-agnostic. Its source is checked out at `../../crnormand/gurps` and granted to Claude
  via `permissions.additionalDirectories` in `.claude/settings.json` — read it to find the real
  shapes of `actor.system` (attributes, HP/FP, skills, melee/ranged) rather than guessing.
- **Design inspiration:** [pf2e-hud](https://github.com/reonZ/pf2e-hud) by reonZ. It is installed
  locally at `~/Library/Application Support/FoundryVTT/Data/modules/pf2e-hud` — read its source
  for reference on layout and interaction patterns, but do not copy code.
- **Audience:** GM-first. HUDs should work for any hovered/selected token, including NPCs;
  player-character conveniences layer on later.

## Dev Workflow

`npm run harness` mounts the HUD against stub Foundry globals so the design can be compared with the
mock without a running world. Its whole cast — Brent, a goblin, a dragon — is always on the canvas,
and each query parameter names the action it takes on that scene: `?hover_panel=attrs` opens a panel
for screenshotting, `?selected_actor=` selects nobody, `?measure=true` dumps bounding boxes to
compare against the mock. `src/dev-harness/main.ts` lists them all, and `e2e/harness.ts` types them
for the specs.

Test world: **Dungeon Crawler World** (`gurps` system).

## Conventions

- One directory per HUD under `src/apps/`, containing its `*App.ts` (ApplicationV2 subclass
  extending `SvelteApp`) and its `*.svelte` root component.
- Svelte components use runes (`$state`, `$props`, `$effect`). Subscribe to Foundry hooks inside
  `$effect` and return a cleanup function that calls `Hooks.off`.
- `src/module.json` is the manifest source of truth; Vite copies it to `dist/module.json`. Its
  version is stamped by the release workflow, never hand-edited.
- Tailwind for layout and most styling; `src/styles/gurps-hud.css` only for overriding Foundry's
  own selectors (e.g. `.window-content` padding) which Tailwind classes can't reach.
- Every Tailwind utility carries the `hud:` prefix — `hud:flex`, `hud:hover:bg-hud-accent`, and the
  marker class `hud:group`. Unprefixed, Tailwind's scanner turns any word in the source (including
  prose in a comment) into a global class, and `.collapse` alone hid Foundry's own sidebar toggle.
  Theme variables are declared bare in `@theme` but emitted prefixed, so read them back as
  `var(--hud-color-hud-panel)`.
- Scope every CSS override to a `#gurps-hud-*` id or `.gurps-hud` class so we never leak styles
  into the rest of Foundry. Put overrides in `@layer base` — an unlayered rule outranks every
  Tailwind utility on the same element.
- No user-facing string is written inline: use `t("some.key")` from `@/i18n`. The catalogue rules
  live in `src/i18n/CLAUDE.md` and `src/lang/README.md`.
- Keep GURPS knowledge in `src/gurps/`. `game-aid.ts` is the only file that touches the `GURPS`
  global, and `hud-view.ts` is where the data-model quirks live: it turns the actor into a flat view
  model, and that is what gets unit tested. Components stay presentational.
- `*.a11y.test.ts` scans assert an exact `EXCEPTIONS` list, so fixing a listed violation fails the
  scan too. See the `hud-a11y-tests` skill before touching them.
- Assertions only a browser can answer belong in `e2e/`, driving the harness rather than a live
  world — see `e2e/CLAUDE.md`.
- The design mock was authored under `content-box`; the HUD renders under `border-box`. Its fixed
  pixel widths therefore need padding and borders added in — the strip is pixel-matched to the mock,
  so check `npm run harness -- ?measure=true` before changing a fixed width.
- Hover states may only change `color`, `background-color` and `border-color`. Anything that gains a
  border on hover carries a 1px transparent border at rest, so hover can never move geometry.
