import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

import { foundryI18n } from "@/i18n/stub";

// The real stylesheet, because axe reads computed styles: without it every colour, every
// `truncate` and every `hidden` the rules care about is missing.
import "@/styles/gurps-hud.css";

// Vitest globals are off, so Testing Library's own auto-cleanup never registers and every
// rendered component would otherwise stay in the document for the next scan to trip over.
afterEach(cleanup);

// Components are scanned in isolation, so the page has to stand in for the strip they normally sit
// in: the HUD's own dark ground, and the `.gurps-hud` class its overrides are scoped to.
document.body.classList.add("gurps-hud");
document.body.style.background = "var(--color-hud-panel)";

// Components localize through Foundry, which is not here. The stub reads the catalogue that ships,
// so a key missing from `lang/en.json` fails the test rather than the world.
(globalThis as { game?: unknown }).game = { i18n: foundryI18n() };
