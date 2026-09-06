# GURPS HUD

A clean, concise heads-up display for playing [GURPS 4e](https://github.com/crnormand/gurps) in
Foundry VTT, inspired by [pf2e-hud](https://github.com/reonZ/pf2e-hud).

Status: **scaffolding.** The build pipeline (Vite + Svelte 5 + Tailwind 4 + ApplicationV2) is
wired up; HUD features are pending design.

## Development

```bash
npm install
npm run dev     # Vite on :30001, proxying Foundry on :30000
npm run build   # emits dist/
```

Symlink the build output into Foundry, then enable the module in a `gurps` world:

```bash
ln -s "$(pwd)/dist" "$HOME/Library/Application Support/FoundryVTT/Data/modules/gurps-hud"
```
