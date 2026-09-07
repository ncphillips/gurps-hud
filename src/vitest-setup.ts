import { cleanup } from "@testing-library/svelte";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library's own auto-cleanup never registers and every
// rendered component would otherwise stay in the document for the next test to trip over.
afterEach(cleanup);
