import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import SpellsPanel from "./SpellsPanel.svelte";
import { fixtureView } from "./hud-fixture";

describe("SpellsPanel accessibility", () => {
  it("is accessible", async () => {
    const { container } = render(SpellsPanel, { spells: fixtureView().spells, onroll: vi.fn() });

    await expect(container).toBeAccessible();
  });
});
