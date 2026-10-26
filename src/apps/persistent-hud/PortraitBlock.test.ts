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
    onshock: vi.fn(),
    onclearshock: vi.fn(),
    onopen: vi.fn(),
    onclose: vi.fn(),
    onminimize: vi.fn(),
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
    choices: [{ key: "t-thor", name: actor.name, img: null, actor }],
    onselectactor: vi.fn(),
    openPanel: null,
    onposture: vi.fn(),
    onshock: vi.fn(),
    onclearshock: vi.fn(),
    onopen: vi.fn(),
    onclose: vi.fn(),
    onminimize: vi.fn(),
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

  it("does not open the shock menu", async () => {
    const props = withoutActor();
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("shock"));

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

  it("opens the shock menu", async () => {
    const props = withActor();
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("shock"));

    expect(props.onopen).toHaveBeenCalledWith("shock");
  });

  test("toggling a shock level", async () => {
    const props = withActor({ openPanel: "shock" });
    render(PortraitBlock, props);

    await fireEvent.click(screen.getByRole("button", { name: "-3" }));

    expect(props.onshock).toHaveBeenCalledWith(-3);
  });

  test("clearing shock", async () => {
    const props = withActor({ openPanel: "shock" });
    render(PortraitBlock, props);

    await fireEvent.click(screen.getByRole("button", { name: "0" }));

    expect(props.onclearshock).toHaveBeenCalled();
  });

  it("marks the shock levels that are on as pressed", () => {
    const view = fixtureView();
    view.shocks = [
      { penalty: -1, on: false },
      { penalty: -2, on: false },
      { penalty: -3, on: true },
      { penalty: -4, on: true },
    ];
    render(PortraitBlock, withActor({ view, openPanel: "shock" }));

    const pressed = screen.getAllByRole("button", { pressed: true }).map((button) => button.textContent?.trim());
    expect(pressed).toEqual(["-3", "-4"]);
  });

  test("a single owned token on the canvas", async () => {
    const props = withActor();
    render(PortraitBlock, props);

    await fireEvent.mouseEnter(trigger("actor"));

    expect(props.onopen).not.toHaveBeenCalled();
  });
});

describe("PortraitBlock's condition", () => {
  const reeling = { label: "REELING", tone: "danger" as const, title: "" };
  const qp = { value: "7", max: "10", tone: "ok" as const };

  it("keeps its vitals cell when the Game Aid does not use Quintessence", () => {
    render(PortraitBlock, withActor({ view: { ...fixtureView(), condition: reeling, qp: null } }));

    expect(document.querySelector("[data-hud-condition-chip]")).toBeNull();
  });

  it("moves over the portrait when Quintessence Points take its cell", () => {
    render(PortraitBlock, withActor({ view: { ...fixtureView(), condition: reeling, qp } }));

    expect(document.querySelector("[data-hud-condition-chip]")?.textContent).toContain("REELING");
  });

  it("leaves out its icon in the vitals cell when reeling and exhausted at once", () => {
    const condition = { label: "RLNG+TIRED", tone: "danger" as const, title: "" };
    render(PortraitBlock, withActor({ view: { ...fixtureView(), condition, qp: null } }));

    expect(document.querySelector("[data-hud-condition-cell] svg")).toBeNull();
  });

  test("over the portrait while neither reeling nor exhausted", () => {
    render(PortraitBlock, withActor({ view: { ...fixtureView(), qp } }));

    expect(document.querySelector("[data-hud-condition-chip]")).toBeNull();
  });
});

describe("PortraitBlock's Quintessence Points", () => {
  test("editing them", async () => {
    const view = { ...fixtureView(), qp: { value: "7", max: "10", tone: "ok" as const } };
    const props = withActor({ view });
    render(PortraitBlock, props);

    await fireEvent.click(screen.getByTitle("Quintessence Points -- click to edit"));
    await fireEvent.input(document.querySelector("input")!, { target: { value: "-2" } });
    await fireEvent.keyDown(document.querySelector("input")!, { key: "Enter" });

    expect(props.onpool).toHaveBeenCalledWith("QP", 5);
  });

  test("an actor that was never given any", () => {
    const view = { ...fixtureView(), qp: { value: "—", max: "—", tone: "ok" as const } };
    render(PortraitBlock, withActor({ view }));

    expect(screen.queryByTitle("Quintessence Points -- click to edit")).toBeNull();
  });

  it("are not shown when the Game Aid does not use Quintessence", () => {
    render(PortraitBlock, withActor({ view: { ...fixtureView(), qp: null } }));

    expect(screen.queryByTitle("Quintessence Points -- click to edit")).toBeNull();
  });
});

describe("PortraitBlock's minimize button", () => {
  it("minimizes the HUD", async () => {
    const props = withActor();
    render(PortraitBlock, props);

    await fireEvent.click(screen.getByTitle("Minimize the HUD"));

    expect(props.onminimize).toHaveBeenCalled();
  });

  /* Getting the strip out of the way is not something an actor has to be selected for. */
  test("no actor selected", async () => {
    const props = withoutActor();
    render(PortraitBlock, props);

    await fireEvent.click(screen.getByTitle("Minimize the HUD"));

    expect(props.onminimize).toHaveBeenCalled();
  });
});
