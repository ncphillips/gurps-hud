import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, test, vi } from "vitest";
import type { MacroPage, MacroSlot } from "@/gurps/game-aid";
import MacroBar from "./MacroBar.svelte";

type MacroBarProps = ComponentProps<typeof MacroBar>;

function filled(slot: number, name: string): MacroSlot {
  return { slot, hotkey: String(slot % 10), name, img: null, uuid: `Macro.${name}` };
}

function empty(slot: number): MacroSlot {
  return { slot, hotkey: String(slot % 10), name: null, img: null, uuid: null };
}

/** A drop payload from outside the bar: no macro of ours was picked up first. */
function externalDrop(): { dataTransfer: DataTransfer } {
  return { dataTransfer: { types: ["text/plain"] } as unknown as DataTransfer };
}

/** Empty slots have no accessible name of their own, so they are selected by their HUD hook. */
function slotAt(slot: number): Element {
  const element = document.querySelector(`[data-hud-macro-slot="${slot}"]`);
  if (!element) throw new Error(`no slot ${slot} rendered`);
  return element;
}

/** Panels and zones carry a `data-hud-*` hook rather than an accessible name of their own. */
function hook(name: string): HTMLElement {
  const element = queryHook(name);
  if (!element) throw new Error(`no [data-hud-${name}] rendered`);
  return element;
}

function queryHook(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-hud-${name}]`);
}

function library(): HTMLElement {
  return hook("macro-library");
}

function bar(): HTMLElement {
  return hook("macro-bar");
}

async function expand(): Promise<HTMLElement> {
  await fireEvent.click(screen.getByTitle("Show all macros"));
  return library();
}

/** Five pages, because that is how many Foundry's hotbar has. */
function pages(): MacroPage[] {
  return [
    { page: 1, slots: [filled(1, "Attack"), filled(2, "Dodge"), empty(3)] },
    { page: 2, slots: [filled(11, "Parry")] },
    { page: 3, slots: [empty(21)] },
    { page: 4, slots: [empty(31)] },
    { page: 5, slots: [empty(41)] },
  ];
}

function props(overrides: Partial<MacroBarProps> = {}): MacroBarProps {
  return {
    pages: pages(),
    page: 1,
    onpage: vi.fn(),
    onexecute: vi.fn(),
    onassign: vi.fn(),
    onmove: vi.fn(),
    onremove: vi.fn(),
    ...overrides,
  };
}

describe("MacroBar removing", () => {
  test("right-clicking a filled slot", async () => {
    const onremove = vi.fn();
    render(MacroBar, props({ onremove }));

    await fireEvent.contextMenu(screen.getByTitle("Attack"));

    expect(onremove).toHaveBeenCalledWith(1);
  });

  test("right-clicking an empty slot", async () => {
    const onremove = vi.fn();
    render(MacroBar, props({ onremove }));

    await fireEvent.contextMenu(slotAt(3));

    expect(onremove).not.toHaveBeenCalled();
  });

  test("pressing Delete on a focused macro", async () => {
    const onremove = vi.fn();
    render(MacroBar, props({ onremove }));

    await fireEvent.keyDown(screen.getByTitle("Dodge"), { key: "Delete" });

    expect(onremove).toHaveBeenCalledWith(2);
  });

  test("pressing Delete does not reach Foundry's own key handlers", async () => {
    const foundry = vi.fn();
    document.addEventListener("keydown", foundry);
    render(MacroBar, props());

    await fireEvent.keyDown(screen.getByTitle("Dodge"), { key: "Delete", bubbles: true });
    document.removeEventListener("keydown", foundry);

    expect(foundry).not.toHaveBeenCalled();
  });

  test("pressing Delete does not also execute the macro", async () => {
    const onexecute = vi.fn();
    render(MacroBar, props({ onexecute }));

    await fireEvent.keyDown(screen.getByTitle("Dodge"), { key: "Delete" });

    expect(onexecute).not.toHaveBeenCalled();
  });
});

describe("MacroBar reordering", () => {
  test("dragging a macro onto another filled slot", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Attack"));
    await fireEvent.drop(screen.getByTitle("Dodge"));

    expect(onmove).toHaveBeenCalledWith(1, 2);
  });

  test("dragging a macro onto an empty slot", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Attack"));
    await fireEvent.drop(slotAt(3));

    expect(onmove).toHaveBeenCalledWith(1, 3);
  });

  test("dropping a macro back on its own slot", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Attack"));
    await fireEvent.drop(screen.getByTitle("Attack"));

    expect(onmove).not.toHaveBeenCalled();
  });

  test("a reordering drop is not treated as an assignment", async () => {
    const onassign = vi.fn();
    render(MacroBar, props({ onassign }));

    await fireEvent.dragStart(screen.getByTitle("Attack"));
    await fireEvent.drop(screen.getByTitle("Dodge"));

    expect(onassign).not.toHaveBeenCalled();
  });

  test("a drop that did not start in the bar", async () => {
    const onassign = vi.fn();
    render(MacroBar, props({ onassign }));

    await fireEvent.drop(slotAt(3), externalDrop());

    expect(onassign).toHaveBeenCalledWith(3, expect.anything());
  });

  test("a drop after the previous drag ended", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Attack"));
    await fireEvent.dragEnd(screen.getByTitle("Attack"));
    await fireEvent.drop(screen.getByTitle("Dodge"), externalDrop());

    expect(onmove).not.toHaveBeenCalled();
  });

  test("pressing Alt+ArrowRight on a focused macro", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Attack"), { key: "ArrowRight", altKey: true });

    expect(onmove).toHaveBeenCalledWith(1, 2);
  });

  test("pressing Alt+ArrowLeft on a focused macro", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Dodge"), { key: "ArrowLeft", altKey: true });

    expect(onmove).toHaveBeenCalledWith(2, 1);
  });

  test("pressing Alt+ArrowLeft on the first slot", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Attack"), { key: "ArrowLeft", altKey: true });

    expect(onmove).not.toHaveBeenCalled();
  });

  test("pressing Alt+ArrowRight on the last slot", async () => {
    const onmove = vi.fn();
    render(
      MacroBar,
      props({ pages: [{ page: 1, slots: [empty(1), filled(2, "Dodge")] }], onmove }),
    );

    await fireEvent.keyDown(screen.getByTitle("Dodge"), { key: "ArrowRight", altKey: true });

    expect(onmove).not.toHaveBeenCalled();
  });

  test("pressing ArrowRight without Alt", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Attack"), { key: "ArrowRight" });

    expect(onmove).not.toHaveBeenCalled();
  });
});

describe("MacroBar executing", () => {
  test("clicking a filled slot", async () => {
    const onexecute = vi.fn();
    render(MacroBar, props({ onexecute }));

    await fireEvent.click(screen.getByTitle("Attack"));

    expect(onexecute).toHaveBeenCalledWith(1);
  });
});

describe("MacroBar paging", () => {
  test("rendering page 2", async () => {
    render(MacroBar, props({ page: 2 }));

    expect(screen.getByTitle("Parry")).toBeDefined();
  });

  test("rendering page 2 does not show page 1's macros", async () => {
    render(MacroBar, props({ page: 2 }));

    expect(screen.queryByTitle("Attack")).toBeNull();
  });

  test("the page indicator on page 3", async () => {
    render(MacroBar, props({ page: 3 }));

    expect(hook("macro-page").textContent?.trim()).toBe("3");
  });

  test("clicking the next-page control", async () => {
    const onpage = vi.fn();
    render(MacroBar, props({ onpage }));

    await fireEvent.click(screen.getByTitle("Next page"));

    expect(onpage).toHaveBeenCalledWith(2);
  });

  test("clicking the previous-page control", async () => {
    const onpage = vi.fn();
    render(MacroBar, props({ page: 3, onpage }));

    await fireEvent.click(screen.getByTitle("Previous page"));

    expect(onpage).toHaveBeenCalledWith(2);
  });

  test("clicking the next-page control on the last page", async () => {
    const onpage = vi.fn();
    render(MacroBar, props({ page: 5, onpage }));

    await fireEvent.click(screen.getByTitle("Next page"));

    expect(onpage).toHaveBeenCalledWith(1);
  });

  test("clicking the previous-page control on the first page", async () => {
    const onpage = vi.fn();
    render(MacroBar, props({ page: 1, onpage }));

    await fireEvent.click(screen.getByTitle("Previous page"));

    expect(onpage).toHaveBeenCalledWith(5);
  });
});

describe("MacroBar library", () => {
  test("before the library is expanded", async () => {
    render(MacroBar, props());

    expect(queryHook("macro-library")).toBeNull();
  });

  test("clicking the expand control", async () => {
    render(MacroBar, props());

    await fireEvent.click(screen.getByTitle("Show all macros"));

    expect(queryHook("macro-library")).not.toBeNull();
  });

  test("clicking the expand control twice", async () => {
    render(MacroBar, props());

    await fireEvent.click(screen.getByTitle("Show all macros"));
    await fireEvent.click(screen.getByTitle("Hide all macros"));

    expect(queryHook("macro-library")).toBeNull();
  });

  test("the library lists every page's macros", async () => {
    render(MacroBar, props());

    expect(within(await expand()).getByTitle("Parry")).toBeDefined();
  });

  test("selecting a page from the library", async () => {
    const onpage = vi.fn();
    render(MacroBar, props({ onpage }));

    await fireEvent.click(within(await expand()).getByTitle("Switch to page 4"));

    expect(onpage).toHaveBeenCalledWith(4);
  });

  test("dragging a macro from the bar into the library", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));

    const expanded = await expand();
    await fireEvent.dragStart(within(bar()).getByTitle("Attack"));
    await fireEvent.drop(within(expanded).getByTitle("Parry"));

    expect(onmove).toHaveBeenCalledWith(1, 11);
  });
});

/*
 * The slot buttons are keyed by slot number, so a move swaps which macro a given button holds
 * while leaving the button itself -- and the focus on it -- exactly where it was. Without moving
 * focus along, a second Alt+Arrow picks up whatever just swapped into the slot under the cursor's
 * keyboard focus rather than the macro the user is walking across the bar.
 */
describe("MacroBar keyboard reordering", () => {
  test("Alt+ArrowRight on a focused macro", async () => {
    render(MacroBar, props());
    const attack = screen.getByTitle("Attack");
    attack.focus();
    await fireEvent.keyDown(attack, { key: "ArrowRight", altKey: true });

    expect(document.activeElement).toBe(slotAt(2));
  });

  test("Alt+ArrowRight twice, walking one macro across the bar", async () => {
    const onmove = vi.fn();
    render(MacroBar, props({ onmove }));
    const attack = screen.getByTitle("Attack");
    attack.focus();
    await fireEvent.keyDown(attack, { key: "ArrowRight", altKey: true });
    await fireEvent.keyDown(document.activeElement!, { key: "ArrowRight", altKey: true });

    expect(onmove.mock.calls).toEqual([
      [1, 2],
      [2, 3],
    ]);
  });

  test("Alt+ArrowLeft on the first slot, where nothing moves", async () => {
    render(MacroBar, props());
    const attack = screen.getByTitle("Attack");
    attack.focus();
    await fireEvent.keyDown(attack, { key: "ArrowLeft", altKey: true });

    expect(document.activeElement).toBe(attack);
  });
});

describe("MacroBar dismissing the library", () => {
  test("pressing Escape with the library open", async () => {
    render(MacroBar, props());
    await expand();
    await fireEvent.keyDown(document, { key: "Escape" });

    expect(queryHook("macro-library")).toBeNull();
  });

  test("pressing Escape with the library closed", async () => {
    render(MacroBar, props());
    await fireEvent.keyDown(document, { key: "Escape" });

    expect(queryHook("macro-library")).toBeNull();
  });

  test("pointing at something outside the footer", async () => {
    render(MacroBar, props());
    await expand();
    await fireEvent.pointerDown(document.body);

    expect(queryHook("macro-library")).toBeNull();
  });

  test("pointing at a slot inside the library", async () => {
    render(MacroBar, props());
    await expand();
    await fireEvent.pointerDown(screen.getByTitle("Parry"));

    expect(queryHook("macro-library")).not.toBeNull();
  });
});
