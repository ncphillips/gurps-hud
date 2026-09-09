import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, it, vi } from "vitest";
import { emptyHudView } from "@/gurps/hud-view";
import { fixtureView } from "./hud-fixture";
import TopBar from "./TopBar.svelte";

type TopBarProps = ComponentProps<typeof TopBar>;

/** The bar with nothing selected: the empty view, and every actor-driven control off. */
function withoutActor(overrides: Partial<TopBarProps> = {}): TopBarProps {
  return {
    view: emptyHudView(),
    enabled: false,
    maneuver: null,
    maneuverEnabled: false,
    openPanel: null,
    onopen: vi.fn(),
    onclose: vi.fn(),
    onselect: vi.fn(),
    targetView: null,
    target: "Torso",
    onselecttarget: vi.fn(),
    onroll: vi.fn(),
    ...overrides,
  };
}

function withActor(overrides: Partial<TopBarProps> = {}): TopBarProps {
  return {
    view: fixtureView(),
    enabled: true,
    maneuver: null,
    maneuverEnabled: false,
    openPanel: null,
    onopen: vi.fn(),
    onclose: vi.fn(),
    onselect: vi.fn(),
    targetView: null,
    target: "Torso",
    onselecttarget: vi.fn(),
    onroll: vi.fn(),
    ...overrides,
  };
}

function trigger(name: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-hud-trigger="${name}"]`);
  if (!element) throw new Error(`no [data-hud-trigger="${name}"] rendered`);
  return element;
}

describe("TopBar with no actor", () => {
  it("blanks Dodge", () => {
    render(TopBar, { props: withoutActor() });

    expect(screen.getByTitle("Roll Dodge").textContent).toContain("—");
  });

  it("has no Dodge to roll", () => {
    render(TopBar, { props: withoutActor() });

    expect(screen.getByTitle("Roll Dodge")).toHaveProperty("disabled", true);
  });

  it("does not open the attributes panel", async () => {
    const props = withoutActor();
    render(TopBar, { props });

    await fireEvent.mouseEnter(trigger("attrs"));

    expect(props.onopen).not.toHaveBeenCalled();
  });

  it("does not open the skills panel", async () => {
    const props = withoutActor();
    render(TopBar, { props });

    await fireEvent.mouseEnter(trigger("skills"));

    expect(props.onopen).not.toHaveBeenCalled();
  });
});

describe("TopBar with an actor", () => {
  it("opens the attributes panel", async () => {
    const props = withActor();
    render(TopBar, { props });

    await fireEvent.mouseEnter(trigger("attrs"));

    expect(props.onopen).toHaveBeenCalledWith("attrs");
  });

  it("rolls Dodge", async () => {
    const props = withActor();
    render(TopBar, { props });

    await fireEvent.click(screen.getByTitle("Roll Dodge"));

    expect(props.onroll).toHaveBeenCalledWith("Dodge", expect.anything());
  });
});
