import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, test, vi } from "vitest";
import type { MacroSlot } from "@/gurps/game-aid";
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

function props(overrides: Partial<MacroBarProps> = {}): MacroBarProps {
  return {
    slots: [filled(1, "Attack"), filled(2, "Dodge"), empty(3)],
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
    render(MacroBar, props({ slots: [empty(1), filled(2, "Dodge")], onmove }));

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
