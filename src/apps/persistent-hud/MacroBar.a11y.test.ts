import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import type { MacroPage, MacroSlot } from "@/gurps/game-aid";
import MacroBar from "./MacroBar.svelte";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = {
  bar: [] as string[],
  library: [] as string[],
};

function filled(slot: number, name: string): MacroSlot {
  return { slot, hotkey: String(slot % 10), name, img: null, uuid: `Macro.${name}` };
}

function empty(slot: number): MacroSlot {
  return { slot, hotkey: String(slot % 10), name: null, img: null, uuid: null };
}

function pages(): MacroPage[] {
  return Array.from({ length: 5 }, (_, index) => ({
    page: index + 1,
    slots: Array.from({ length: 10 }, (_, offset) => {
      const slot = index * 10 + offset + 1;
      return offset < 3 ? filled(slot, `Macro ${slot}`) : empty(slot);
    }),
  }));
}

function props() {
  return {
    pages: pages(),
    page: 1,
    onpage: vi.fn(),
    onexecute: vi.fn(),
    onassign: vi.fn(),
    onmove: vi.fn(),
    onremove: vi.fn(),
  };
}

describe("MacroBar accessibility", () => {
  it("has no violations as the collapsed bar", async () => {
    const { container } = render(MacroBar, props());

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.bar);
  });

  test("expanded to the full macro library", async () => {
    const { container } = render(MacroBar, props());
    await fireEvent.click(screen.getByTitle("Show all macros"));

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.library);
  });
});
