import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { afterEach, describe, expect, it, test, vi } from "vitest";
import type { Mock } from "vitest";
import { dragging } from "@/testing/dragging";
import type { Gesture } from "@/testing/dragging";
import { dragPayload, noPicks } from "@/gurps/attack-picks";
import { emptyHudView } from "@/gurps/hud-view";
import { attackDrag } from "./attack-drag";
import { fixtureView } from "./hud-fixture";
import WeaponTables from "./WeaponTables.svelte";

type Props = ComponentProps<typeof WeaponTables>;

/** Thor's rows, keyed the way the GURPS sheet keys them. */
const SPEAR = "system.melee.00000";
const PUNCH = "system.melee.00001";
const THROWN = "system.ranged.00000";

function props(overrides: Partial<Props> = {}): Props {
  return {
    view: fixtureView(),
    enabled: true,
    actorId: "actor-thor",
    drag: attackDrag(),
    onroll: vi.fn(),
    onplace: vi.fn(),
    onremove: vi.fn(),
    onnudge: vi.fn(),
    onpickall: vi.fn(),
    ...overrides,
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

/** The name cell of a row -- one of the children the pointer crosses on its way across it. */
function nameCellIn(key: string): Element {
  return row(key).querySelector("span")!;
}

function tables(): Element {
  return document.querySelector("[data-hud-attacks]")!;
}

/*
 * An attack dragged off a character sheet, which is where every pick comes from. Always Thor's own
 * sheet: refusing another character's attack is the strip's decision, not the tables' -- it is
 * `isFromActor` in `PersistentHud`, and e2e/attack-picks.spec.ts is where the gesture is driven.
 */
function draggedOffTheSheet(key: string): Gesture {
  return dragging(dragPayload("actor-thor", key));
}

/** An attack already picked, taken by its own grip: the drag that reorders one or takes it off. */
function draggedByItsGrip(key: string): Gesture {
  return dragging(dragPayload("actor-thor", key), grip(key));
}

/** A macro dragged out of the footer -- an attack's MIME type, and nothing to do with an attack. */
function draggedFromTheMacroFooter(): Gesture {
  return dragging(JSON.stringify({ type: "Macro", uuid: "Macro.1", slot: 1 }));
}

/*
 * Foundry's own drop handlers sit on the page behind the strip, and a drop the tables cannot use
 * has to reach them. Nothing here mounts Foundry, so the stand-in is a listener on the document --
 * removed after the test, or the next test's drops would still be counted by this one's spy.
 */
const listening: Array<() => void> = [];
afterEach(() => {
  for (const stop of listening.splice(0)) stop();
});

function dropsReachingThePage(): Mock {
  const reached = vi.fn();
  document.addEventListener("drop", reached);
  listening.push(() => document.removeEventListener("drop", reached));

  return reached;
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

    await draggedOffTheSheet(PUNCH).dropOn(tables());

    expect(onplace).toHaveBeenCalledWith(expect.anything(), null);
  });

  it("puts an attack dropped on a row ahead of that row", async () => {
    const onplace = vi.fn();
    render(WeaponTables, props({ onplace }));

    await draggedOffTheSheet(THROWN).dropOn(row(PUNCH));

    expect(onplace).toHaveBeenCalledWith(expect.anything(), PUNCH);
  });

  it("places a row drop once, not again as a drop on the tables behind it", async () => {
    const onplace = vi.fn();
    render(WeaponTables, props({ onplace }));

    await draggedOffTheSheet(SPEAR).dropOn(row(PUNCH));

    expect(onplace).toHaveBeenCalledOnce();
  });

  it("marks the row the pointer is over as where the attack would land", async () => {
    const drag = attackDrag();
    render(WeaponTables, props({ drag }));

    await draggedOffTheSheet(SPEAR).over(row(PUNCH));

    expect(drag.over).toBe(PUNCH);
  });

  /* The name and the readouts are most of a row, and crossing onto one of them leaves the row. */
  test("the pointer crossing from the row onto the attack's name", async () => {
    const drag = attackDrag();
    render(WeaponTables, props({ drag }));

    await draggedOffTheSheet(SPEAR).over(row(PUNCH)).over(nameCellIn(PUNCH));

    expect(drag.over).toBe(PUNCH);
  });
});

describe("WeaponTables, a drag that is not an attack", () => {
  it("lets a macro dropped on a weapon row through to the page behind the strip", async () => {
    render(WeaponTables, props());
    const reachedThePage = dropsReachingThePage();

    await draggedFromTheMacroFooter().dropOn(row(PUNCH));

    expect(reachedThePage).toHaveBeenCalledOnce();
  });

  test("a macro dropped on a weapon row", async () => {
    const onplace = vi.fn();
    render(WeaponTables, props({ onplace }));

    await draggedFromTheMacroFooter().dropOn(row(PUNCH));

    expect(onplace).not.toHaveBeenCalled();
  });
});

describe("WeaponTables, the grip", () => {
  it("removes the attack when it is dragged clear of the strip", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await draggedByItsGrip(SPEAR).outOf(tables());

    expect(onremove).toHaveBeenCalledWith(SPEAR);
  });

  /*
   * Escape ends a drag where it stands: `dragend` fires with nothing dropped, exactly as it does
   * for an attack flicked off the strip. The attack never went anywhere, so it is still picked.
   */
  test("a drag cancelled without ever leaving the tables", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await draggedByItsGrip(SPEAR).over(row(PUNCH)).cancel();

    expect(onremove).not.toHaveBeenCalled();
  });

  test("a drag the tables took the drop for", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await draggedByItsGrip(SPEAR).dropOn(row(PUNCH));

    expect(onremove).not.toHaveBeenCalled();
  });

  it("removes the attack on Delete", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await fireEvent.keyDown(grip(THROWN), { key: "Delete" });

    expect(onremove).toHaveBeenCalledWith(THROWN);
  });

  /* Nothing tells you it would, and an 11px target is too easy to hit by accident. */
  test("a right-click on the grip", async () => {
    const onremove = vi.fn();
    render(WeaponTables, props({ onremove }));

    await fireEvent.contextMenu(grip(THROWN));

    expect(onremove).not.toHaveBeenCalled();
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
