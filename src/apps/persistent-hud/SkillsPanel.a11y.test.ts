import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import SkillsPanel from "./SkillsPanel.svelte";
import { fixtureView } from "./hud-fixture";

describe("SkillsPanel accessibility", () => {
  it("is accessible", async () => {
    const { container } = render(SkillsPanel, { skills: fixtureView().skills, onroll: vi.fn() });

    await expect(container).toBeAccessible();
  });

  test("an actor with no skills", async () => {
    const { container } = render(SkillsPanel, { skills: [], onroll: vi.fn() });

    await expect(container).toBeAccessible();
  });
});
