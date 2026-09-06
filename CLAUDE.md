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
npm run check          # tsc --noEmit + svelte-check
npm run lint           # ESLint
npm run format         # Prettier
npm run test           # Vitest
```

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
  gurps-hud.d.ts           # fvtt-types module augmentation (flags, etc.)
  apps/
    SvelteApp.ts           # ApplicationV2 <-> Svelte 5 mount/unmount bridge
    scaffold-check/        # throwaway smoke test — delete once real HUDs land
  styles/
    gurps-hud.css          # Tailwind entry + Foundry overrides
dist/                      # build output (gitignored) — symlinked into Foundry
```

## Conventions

- One directory per HUD under `src/apps/`, containing its `*App.ts` (ApplicationV2 subclass
  extending `SvelteApp`) and its `*.svelte` root component.
- Svelte components use runes (`$state`, `$props`, `$effect`). Subscribe to Foundry hooks inside
  `$effect` and return a cleanup function that calls `Hooks.off`.
- Tailwind for layout and most styling; `src/styles/gurps-hud.css` only for overriding Foundry's
  own selectors (e.g. `.window-content` padding) which Tailwind classes can't reach.
- Scope every CSS override to a `#gurps-hud-*` id or `.gurps-hud` class so we never leak styles
  into the rest of Foundry.
