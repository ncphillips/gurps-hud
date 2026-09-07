import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import AttrsPanel from "./AttrsPanel.svelte";
import { fixtureView } from "./hud-fixture";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS: string[] = [];

describe("AttrsPanel accessibility", () => {
  it("has no violations", async () => {
    const view = fixtureView();
    const { container } = render(AttrsPanel, {
      basic: view.attrs.basic,
      secondary: view.attrs.secondary,
      onroll: vi.fn(),
    });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS);
  });
});
