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

## Stack

TypeScript 5 · Vite 6 · Svelte 5 (runes) · Tailwind 4 · fvtt-types (GitHub main) ·
ESLint 9 flat config · Prettier · Vitest

## Dev Workflow

```bash
npm install            # first time
npm run build          # produces dist/
npm run dev            # Vite dev server on :30001 — load Foundry via http://localhost:30001
npm run harness        # HUD only, no Foundry, on :30099 — see src/dev-harness
npm run check          # tsc --noEmit + svelte-check
npm run lint           # ESLint
npm run format         # Prettier
npm run test           # Vitest (jsdom) — pure logic in src/gurps and component behaviour
npm run test:e2e       # Playwright against the dev harness; --ui to watch it
npm run test:a11y      # axe-core — components in Vitest browser mode, then the whole strip
```

`npm run harness` mounts the HUD against stub Foundry globals so the design can be compared with
`design-handoff/` without a running world. `?panel=attrs|maneuver` opens a hover panel for
screenshotting; `?measure` dumps bounding boxes to compare against the mock.

`dist/` is already symlinked into Foundry:

```bash
ln -s "$(pwd)/dist" "$HOME/Library/Application Support/FoundryVTT/Data/modules/gurps-hud"
```

Test world: **Dungeon Crawler World** (`gurps` system).

## Project Layout

```
src/
  module.ts                # entry point — registers hooks/keybindings, built to dist/module.js
  module.json              # manifest source of truth — Vite copies to dist/module.json
  log.ts                   # console helpers namespaced to "gurps-hud |"
  a11y-scan.ts             # axe-core -> a list of violation lines, shared by both a11y groups
  a11y-setup.ts            # Vitest browser-mode setup: the real stylesheet and the HUD's ground
  gurps-hud.d.ts           # fvtt-types module augmentation (custom hooks, flags)
  gurps/                   # everything that knows about the GURPS system
    system-types.ts        # structural types for the slice of actor.system we read
    game-aid.ts            # the only file that touches the `GURPS` global
    hud-view.ts            # pure actor -> view model; where the data-model quirks live
    otf.ts                 # On-The-Fly roll string builders
    maneuvers.ts           # the twelve maneuvers the HUD offers
  apps/
    SvelteApp.ts           # ApplicationV2 <-> Svelte 5 mount/unmount bridge
    persistent-hud/        # the always-mounted bottom-left strip
  dev-harness/             # renders the HUD outside Foundry (npm run harness)
  styles/
    gurps-hud.css          # Tailwind entry, design tokens, @font-face, Foundry overrides
    fonts/                 # self-hosted Barlow Semi Condensed + JetBrains Mono (SIL OFL 1.1)
dist/                      # build output (gitignored) — symlinked into Foundry
e2e/                       # Playwright specs — drive the dev harness, never a live Foundry
```

## Conventions

- One directory per HUD under `src/apps/`, containing its `*App.ts` (ApplicationV2 subclass
  extending `SvelteApp`) and its `*.svelte` root component.
- Svelte components use runes (`$state`, `$props`, `$effect`). Subscribe to Foundry hooks inside
  `$effect` and return a cleanup function that calls `Hooks.off`.
- Tailwind for layout and most styling; `src/styles/gurps-hud.css` only for overriding Foundry's
  own selectors (e.g. `.window-content` padding) which Tailwind classes can't reach.
- Scope every CSS override to a `#gurps-hud-*` id or `.gurps-hud` class so we never leak styles
  into the rest of Foundry. Put overrides in `@layer base` — an unlayered rule outranks every
  Tailwind utility on the same element.
- Keep GURPS knowledge in `src/gurps/`. Components stay presentational: `hud-view.ts` turns the
  actor into a flat view model, and that is what gets unit tested.
- Accessibility is its own group, named `*.a11y.test.ts` in both runners: a component's scans sit
  beside it and mount it in Vitest's browser mode (headless Chromium, driven by Playwright), and
  `e2e/persistent-hud.a11y.test.ts` scans the assembled strip in each state the harness can open.
  Both call `axeViolations` from `src/a11y-scan.ts` and assert the exact list against that file's
  `EXCEPTIONS` array — the accessibility to-do list for what it scans. A new violation fails the
  scan and so does fixing a listed one, so no exception outlives the problem it records. Contrast is
  excluded from every scan and tracked by one `test.fixme`: it is a design call on the palette, not
  a markup fix.
- Anything else only a browser can answer — does this wrap, is this box where the mock puts it —
  belongs in `e2e/`, driving the harness via its query parameters rather than a live world.
  Give elements a `data-hud-*` hook to select on. `Locator.evaluateAll` does **not** auto-wait, so
  wait for the panel first (`openHarness` does) or the measurement silently runs against nothing.
- The design mock in `design-handoff/` was authored under `content-box`; the HUD renders under
  `border-box`. Its fixed pixel widths therefore need padding and borders added in — the strip is
  pixel-matched to the mock, so check `npm run harness -- ?measure` before changing a fixed width.
- Hover states may only change `color`, `background-color` and `border-color`. Anything that gains a
  border on hover carries a 1px transparent border at rest, so hover can never move geometry.
