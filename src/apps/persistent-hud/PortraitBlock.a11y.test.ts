import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import { fixtureActor, fixtureView } from "./hud-fixture";
import PortraitBlock from "./PortraitBlock.svelte";
import type { Panel } from "./panels";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = {
  closed: [] as string[],
  switcher: [] as string[],
  posture: [] as string[],
  locked: [] as string[],
};

function props(openPanel: Panel | null = null) {
  const actor = fixtureActor();
  const other = { ...fixtureActor(), id: "actor-goblin", name: "Goblin Grunt" };

  return {
    view: fixtureView(),
    actor,
    onpool: vi.fn(),
    onopensheet: vi.fn(),
    locked: false,
    ontogglelock: vi.fn(),
    choices: [
      { key: "t-brent", name: actor.name, img: null, actor },
      { key: "t-goblin", name: other.name, img: null, actor: other },
    ],
    onselectactor: vi.fn(),
    openPanel,
    onposture: vi.fn(),
    onopen: vi.fn(),
    onclose: vi.fn(),
  };
}

describe("PortraitBlock accessibility", () => {
  it("has no violations with every menu closed", async () => {
    const { container } = render(PortraitBlock, props());

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.closed);
  });

  test("the character switcher open", async () => {
    const { container } = render(PortraitBlock, props("actor"));

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.switcher);
  });

  test("the posture menu open", async () => {
    const { container } = render(PortraitBlock, props("posture"));

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.posture);
  });

  test("locked to its character", async () => {
    const { container } = render(PortraitBlock, { ...props(), locked: true });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.locked);
  });
});
