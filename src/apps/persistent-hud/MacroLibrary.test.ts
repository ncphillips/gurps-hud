import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, test, vi } from "vitest";
import type { MacroPage, MacroSlot } from "@/gurps/game-aid";
import { macroDrag } from "./macro-drag";
import MacroLibrary from "./MacroLibrary.svelte";

type MacroLibraryProps = ComponentProps<typeof MacroLibrary>;

function filled(slot: number, name: string): MacroSlot {
  return { slot, hotkey: String(slot % 10), name, img: null, uuid: `Macro.${name}` };
}

function empty(slot: number): MacroSlot {
  return { slot, hotkey: String(slot % 10), name: null, img: null, uuid: null };
}

/** A drop payload from outside the library: no macro of ours was picked up first. */
function externalDrop(): { dataTransfer: DataTransfer } {
  return { dataTransfer: { types: ["text/plain"] } as unknown as DataTransfer };
}

function slotAt(slot: number): Element {
  const element = document.querySelector(`[data-hud-macro-slot="${slot}"]`);
  if (!element) throw new Error(`no slot ${slot} rendered`);
  return element;
}

/**
 * Foundry's five pages of ten. The first and last slot of every page hold a macro, so the edges of
 * each row -- where the keyboard nudges have to stop -- are draggable.
 */
function pages(): MacroPage[] {
  return Array.from({ length: 5 }, (_, index) => ({
    page: index + 1,
    slots: Array.from({ length: 10 }, (_, offset) => {
      const slot = index * 10 + offset + 1;
      return offset === 0 || offset === 9 ? filled(slot, `Macro ${slot}`) : empty(slot);
    }),
  }));
}

function props(overrides: Partial<MacroLibraryProps> = {}): MacroLibraryProps {
  return {
    pages: pages(),
    page: 1,
    drag: macroDrag(),
    onpage: vi.fn(),
    onexecute: vi.fn(),
    onassign: vi.fn(),
    onmove: vi.fn(),
    onremove: vi.fn(),
    ...overrides,
  };
}

describe("MacroLibrary", () => {
  test("rendering all five pages", async () => {
    render(MacroLibrary, props());

    expect(document.querySelectorAll("[data-hud-macro-slot]")).toHaveLength(50);
  });

  test("a macro on the last page", async () => {
    render(MacroLibrary, props());

    expect(screen.getByTitle("Macro 41")).toBeDefined();
  });
});

describe("MacroLibrary paging", () => {
  test("clicking a page number", async () => {
    const onpage = vi.fn();
    render(MacroLibrary, props({ onpage }));

    await fireEvent.click(screen.getByTitle("Switch to page 4"));

    expect(onpage).toHaveBeenCalledWith(4);
  });

  test("the current page is marked", async () => {
    render(MacroLibrary, props({ page: 3 }));

    expect(screen.getByTitle("Switch to page 3").getAttribute("aria-current")).toBe("true");
  });

  test("another page is not marked", async () => {
    render(MacroLibrary, props({ page: 3 }));

    expect(screen.getByTitle("Switch to page 2").getAttribute("aria-current")).toBeNull();
  });
});

describe("MacroLibrary reordering", () => {
  test("dragging a macro onto an empty slot on another page", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Macro 1"));
    await fireEvent.drop(slotAt(25));

    expect(onmove).toHaveBeenCalledWith(1, 25);
  });

  test("dragging a macro onto a filled slot on another page", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Macro 1"));
    await fireEvent.drop(screen.getByTitle("Macro 31"));

    expect(onmove).toHaveBeenCalledWith(1, 31);
  });

  test("dropping a macro back on its own slot", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.dragStart(screen.getByTitle("Macro 1"));
    await fireEvent.drop(screen.getByTitle("Macro 1"));

    expect(onmove).not.toHaveBeenCalled();
  });

  test("a drop that did not start in the library", async () => {
    const onassign = vi.fn();
    render(MacroLibrary, props({ onassign }));

    await fireEvent.drop(slotAt(25), externalDrop());

    expect(onassign).toHaveBeenCalledWith(25, expect.anything());
  });
});

describe("MacroLibrary removing", () => {
  test("right-clicking a filled slot", async () => {
    const onremove = vi.fn();
    render(MacroLibrary, props({ onremove }));

    await fireEvent.contextMenu(screen.getByTitle("Macro 20"));

    expect(onremove).toHaveBeenCalledWith(20);
  });

  test("pressing Delete on a focused macro", async () => {
    const onremove = vi.fn();
    render(MacroLibrary, props({ onremove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 20"), { key: "Delete" });

    expect(onremove).toHaveBeenCalledWith(20);
  });
});

describe("MacroLibrary executing", () => {
  test("clicking a filled slot", async () => {
    const onexecute = vi.fn();
    render(MacroLibrary, props({ onexecute }));

    await fireEvent.click(screen.getByTitle("Macro 41"));

    expect(onexecute).toHaveBeenCalledWith(41);
  });
});

describe("MacroLibrary keyboard", () => {
  test("pressing Alt+ArrowRight", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 1"), { key: "ArrowRight", altKey: true });

    expect(onmove).toHaveBeenCalledWith(1, 2);
  });

  test("pressing Alt+ArrowRight on the last slot of a page", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 10"), { key: "ArrowRight", altKey: true });

    expect(onmove).not.toHaveBeenCalled();
  });

  test("pressing Alt+ArrowDown", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 1"), { key: "ArrowDown", altKey: true });

    expect(onmove).toHaveBeenCalledWith(1, 11);
  });

  test("pressing Alt+ArrowUp", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 11"), { key: "ArrowUp", altKey: true });

    expect(onmove).toHaveBeenCalledWith(11, 1);
  });

  test("pressing Alt+ArrowUp on the first page", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 1"), { key: "ArrowUp", altKey: true });

    expect(onmove).not.toHaveBeenCalled();
  });

  test("pressing Alt+ArrowDown on the last page", async () => {
    const onmove = vi.fn();
    render(MacroLibrary, props({ onmove }));

    await fireEvent.keyDown(screen.getByTitle("Macro 41"), { key: "ArrowDown", altKey: true });

    expect(onmove).not.toHaveBeenCalled();
  });

  test("pressing Delete does not reach Foundry's own key handlers", async () => {
    const foundry = vi.fn();
    document.addEventListener("keydown", foundry);
    render(MacroLibrary, props());

    await fireEvent.keyDown(screen.getByTitle("Macro 1"), { key: "Delete", bubbles: true });
    document.removeEventListener("keydown", foundry);

    expect(foundry).not.toHaveBeenCalled();
  });
});
