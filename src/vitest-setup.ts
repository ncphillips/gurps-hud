import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

import { foundryI18n } from "@/i18n/stub";

// Vitest globals are off, so Testing Library's own auto-cleanup never registers and every
// rendered component would otherwise stay in the document for the next test to trip over.
afterEach(cleanup);

// Components localize through Foundry, which is not here. The stub reads the catalogue that ships,
// so a key missing from `lang/en.json` fails the test rather than the world.
(globalThis as { game?: unknown }).game = { i18n: foundryI18n() };
