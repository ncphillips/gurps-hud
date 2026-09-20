import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import AttrsPanel from "./AttrsPanel.svelte";
import { fixtureView } from "./hud-fixture";

describe("AttrsPanel accessibility", () => {
  it("is accessible", async () => {
    const view = fixtureView();
    const { container } = render(AttrsPanel, {
      basic: view.attrs.basic,
      secondary: view.attrs.secondary,
      onroll: vi.fn(),
    });

    await expect(container).toBeAccessible();
  });
});
