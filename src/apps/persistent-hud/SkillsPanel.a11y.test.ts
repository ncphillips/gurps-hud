import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import SkillsPanel from "./SkillsPanel.svelte";
import { fixtureView } from "./hud-fixture";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = {
  skills: [] as string[],
  empty: [] as string[],
};

describe("SkillsPanel accessibility", () => {
  it("has no violations", async () => {
    const { container } = render(SkillsPanel, { skills: fixtureView().skills, onroll: vi.fn() });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.skills);
  });

  test("an actor with no skills", async () => {
    const { container } = render(SkillsPanel, { skills: [], onroll: vi.fn() });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.empty);
  });
});
