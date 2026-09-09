import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, it, test, vi } from "vitest";
import { emptyHudView } from "@/gurps/hud-view";
import { fixtureActor, fixtureView } from "./hud-fixture";
import PortraitBlock from "./PortraitBlock.svelte";

type PortraitBlockProps = ComponentProps<typeof PortraitBlock>;

/** The strip with nothing selected: the empty view, no actor behind it, every control off. */
function withoutActor(overrides: Partial<PortraitBlockProps> = {}): PortraitBlockProps {
  return {
    view: emptyHudView(),
    enabled: false,
    actor: null,
    onpool: vi.fn(),
    onopensheet: vi.fn(),
    locked: false,
    ontogglelock: vi.fn(),
    choices: [],
    onselectactor: vi.fn(),
    openPanel: null,
    onposture: vi.fn(),
    onopen: vi.fn(),
    onclose: vi.fn(),
    ...overrides,
  };
}

function withActor(overrides: Partial<PortraitBlockProps> = {}): PortraitBlockProps {
  const actor = fixtureActor();

  return {
    view: fixtureView(),
    enabled: true,
    actor,
    onpool: vi.fn(),
    onopensheet: vi.fn(),
    locked: false,
    ontogglelock: vi.fn(),
    choices: [{ key: "t-brent", name: actor.name, img: null, actor }],
    onselectactor: vi.fn(),
    openPanel: null,
    onposture: vi.fn(),
    onopen: vi.fn(),
    onclose: vi.fn(),
    ...overrides,
  };
}

function trigger(name: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-hud-trigger="${name}"]`);
  if (!element) throw new Error(`no [data-hud-trigger="${name}"] rendered`);
  return element;
}

describe("PortraitBlock with no actor", () => {
  it("asks for an actor in place of a character name", () => {
    render(PortraitBlock, withoutActor());

    expect(screen.getByText("Select Actor")).toBeTruthy();
  });

  it("cannot be locked to a character", () => {
    render(PortraitBlock, withoutActor());

    expect(screen.getByTitle("Click to lock the HUD to this character")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("has no hit points to edit", () => {
    render(PortraitBlock, withoutActor());

    expect(screen.queryByTitle("Hit Points -- click to edit")).toBeNull();
  });

  it("has no fatigue points to edit", () => {
    render(PortraitBlock, withoutActor());

    expect(screen.queryByTitle("Fatigue Points -- click to edit")).toBeNull();
  });

  it("does not open the character sheet", async () => {
    const props = withoutActor();
    render(PortraitBlock, props);

    await fireEvent.dblClick(screen.getByText("Select Actor"));

    expect(props.onopensheet).not.toHaveBeenCalled();
  });

  it("does not open the posture menu", async () => {
    const props = withoutActor();
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("posture"));

    expect(props.onopen).not.toHaveBeenCalled();
  });

  test("a token on the canvas to switch to", async () => {
    const other = { ...fixtureActor(), id: "actor-goblin", name: "Goblin Grunt" };
    const props = withoutActor({
      choices: [{ key: "t-goblin", name: other.name, img: null, actor: other }],
    });
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("actor"));

    expect(props.onopen).toHaveBeenCalledWith("actor");
  });
});

describe("PortraitBlock with an actor", () => {
  it("opens the posture menu", async () => {
    const props = withActor();
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("posture"));

    expect(props.onopen).toHaveBeenCalledWith("posture");
  });

  test("a single owned token on the canvas", async () => {
    const props = withActor();
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("actor"));

    expect(props.onopen).not.toHaveBeenCalled();
  });
});
