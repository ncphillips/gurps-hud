import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, it, test, vi } from "vitest";
import { dragPayload, noPicks } from "@/gurps/attack-picks";
import { emptyHudView } from "@/gurps/hud-view";
import { attackDrag } from "./attack-drag";
import { fixtureView } from "./hud-fixture";
import WeaponTables from "./WeaponTables.svelte";

type Props = ComponentProps<typeof WeaponTables>;

/** Brent's rows, keyed the way the GURPS sheet keys them. */
const SPEAR = "system.melee.00000";
const PUNCH = "system.melee.00001";
const THROWN = "system.ranged.00000";

function props(overrides: Partial<Props> = {}): Props {
  return {
    view: fixtureView(),
    enabled: true,
    actorId: "actor-brent",
    drag: attackDrag(),
    onroll: vi.fn(),
    onplace: vi.fn(),
    onremove: vi.fn(),
    onnudge: vi.fn(),
    onpickall: vi.fn(),
    ...overrides,
  };
}

/** A drag payload as the character sheet -- or the strip's own grip -- hands it over. */
function carrying(key: string, actorId = "actor-brent"): { dataTransfer: DataTransfer } {
  return {
    dataTransfer: {
      types: ["text/plain"],
      getData: () => dragPayload(actorId, key),
      setData: () => undefined,
    } as unknown as DataTransfer,
  };
}

function grip(key: string): Element {
  const element = document.querySelector(`[data-hud-attack-handle="${key}"]`);
  if (!element) throw new Error(`no grip rendered for ${key}`);
  return element;
}

function row(key: string): Element {
  const element = document.querySelector(`[data-hud-attack="${key}"]`);
  if (!element) throw new Error(`no row rendered for ${key}`);
  return element;
}

function tables(): Element {
  return document.querySelector("[data-hud-attacks]")!;
}

describe("WeaponTables, with nothing picked", () => {
  it("offers to add every attack", () => {
    render(WeaponTables, props({ view: fixtureView(noPicks()) }));

    expect(screen.getByRole("button", { name: "Add every attack" })).toBeTruthy();
  });

  it("says where attacks come from", () => {
    render(WeaponTables, props({ view: fixtureView(noPicks()) }));

    expect(screen.getByText(/Drag them here from the character sheet/)).toBeTruthy();
  });

  it("adds every attack when the offer is taken", async () => {
    const onpickall = vi.fn();
    render(WeaponTables, props({ view: fixtureView(noPicks()), onpickall }));

    await fireEvent.click(screen.getByRole("button", { name: "Add every attack" }));

    expect(onpickall).toHaveBeenCalledOnce();
  });

  test("an actor who has no attacks to pick from", () => {
    const view = { ...fixtureView(noPicks()), hasAttacks: false };
    render(WeaponTables, props({ view }));

    expect(screen.queryByRole("button", { name: "Add every attack" })).toBeNull();
  });

  test("nothing selected", () => {
    render(WeaponTables, props({ view: emptyHudView(), enabled: false, actorId: null }));

    expect(screen.queryByRole("button", { name: "Add every attack" })).toBeNull();
  });
});

describe("WeaponTables, dropping an attack", () => {
  it("puts an attack dropped on the tables at the end of its group", async () => {
    const onplace = vi.fn();
    render(WeaponTables, props({ onplace }));

    await fireEvent.drop(tables(), carrying(PUNCH));

    expect(onplace).toHaveBeenCalledWith(expect.anything(), null);
  });

  it("puts an attack dropped on a row ahead of that row", async () => {
    const onplace = vi.fn();
    render(WeaponTables, props({ onplace }));

    await fireEvent.drop(row(PUNCH), carrying(THROWN));

    expect(onplace).toHaveBeenCalledWith(expect.anything(), PUNCH);
  });

  it("places a row drop once, not again as a drop on the tables behind it", async () => {
    const onplace = vi.fn();
    render(WeaponTables, props({ onplace }));

    await fireEvent.drop(row(PUNCH), carrying(SPEAR));

    expect(onplace).toHaveBeenCalledOnce();
  });

  it("marks the row the pointer is over as where the attack would land", async () => {
    const drag = attackDrag();
    render(WeaponTables, props({ drag }));

    await fireEvent.dragEnter(row(PUNCH), carrying(SPEAR));

    expect(drag.over).toBe(PUNCH);
  });
});

describe("WeaponTables, the grip", () => {
  it("removes the attack when it is dragged clear of the strip", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await fireEvent.dragStart(grip(SPEAR), carrying(SPEAR));
    await fireEvent.dragEnd(grip(SPEAR));

    expect(onremove).toHaveBeenCalledWith(SPEAR);
  });

  test("a drag the strip took the drop for", async () => {
    const drag = attackDrag();
    const onremove = vi.fn();
    render(WeaponTables, props({ drag, onremove }));

    await fireEvent.dragStart(grip(SPEAR), carrying(SPEAR));
    await fireEvent.drop(row(PUNCH), carrying(SPEAR));
    await fireEvent.dragEnd(grip(SPEAR));

    expect(onremove).not.toHaveBeenCalled();
  });

  it("removes the attack on Delete", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await fireEvent.keyDown(grip(THROWN), { key: "Delete" });

    expect(onremove).toHaveBeenCalledWith(THROWN);
  });

  it("removes the attack on a right-click", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await fireEvent.contextMenu(grip(THROWN));

    expect(onremove).toHaveBeenCalledWith(THROWN);
  });

  it("moves the attack a place down the group on Alt+ArrowDown", async () => {
    const onnudge = vi.fn();
    render(WeaponTables, props({ onnudge }));

    await fireEvent.keyDown(grip(SPEAR), { key: "ArrowDown", altKey: true });

    expect(onnudge).toHaveBeenCalledWith(SPEAR, 1);
  });

  it("moves the attack a place up the group on Alt+ArrowUp", async () => {
    const onnudge = vi.fn();
    render(WeaponTables, props({ onnudge }));

    await fireEvent.keyDown(grip(PUNCH), { key: "ArrowUp", altKey: true });

    expect(onnudge).toHaveBeenCalledWith(PUNCH, -1);
  });

  /* Foundry's own keybindings listen on the document, where an arrow is history navigation. */
  test("an arrow pressed without Alt", async () => {
    const onnudge = vi.fn();
    render(WeaponTables, props({ onnudge }));

    await fireEvent.keyDown(grip(PUNCH), { key: "ArrowUp" });

    expect(onnudge).not.toHaveBeenCalled();
  });

  it("names the attack it grips", () => {
    render(WeaponTables, props());

    expect(grip(SPEAR).getAttribute("title")).toMatch(/^Spear · Thrust:/);
  });
});
