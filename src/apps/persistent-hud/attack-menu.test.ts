import { describe, expect, it, test, vi } from "vitest";
import { attackMenuEntries } from "./attack-menu";
import type { AttackMenuActions } from "./attack-menu";

const SPEAR = "system.melee.00000";

function actions(overrides: Partial<AttackMenuActions> = {}): AttackMenuActions {
  return {
    hasNotes: () => true,
    notesShown: () => true,
    toggleNotes: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  };
}

function rowFor(key: string): HTMLElement {
  const row = document.createElement("div");
  row.dataset.hudAttack = key;
  return row;
}

function entry(menu: ReturnType<typeof attackMenuEntries>, label: string) {
  const found = menu.find((candidate) => candidate.label === label);
  if (!found) throw new Error(`no ${label} entry`);
  return found;
}

function visible(menu: ReturnType<typeof attackMenuEntries>, label: string, key: string): boolean {
  const condition = entry(menu, label).visible;
  return typeof condition === "function" ? !!condition(rowFor(key)) : condition !== false;
}

describe("attackMenuEntries", () => {
  it("removes the attack it was opened on", async () => {
    const remove = vi.fn();
    const menu = attackMenuEntries(actions({ remove }));

    await entry(menu, "Remove").onClick?.(new PointerEvent("click"), rowFor(SPEAR));

    expect(remove).toHaveBeenCalledWith(SPEAR);
  });

  it("toggles the notes of the attack it was opened on", async () => {
    const toggleNotes = vi.fn();
    const menu = attackMenuEntries(actions({ toggleNotes }));

    await entry(menu, "Hide Notes").onClick?.(new PointerEvent("click"), rowFor(SPEAR));

    expect(toggleNotes).toHaveBeenCalledWith(SPEAR);
  });

  it("offers to hide notes that are showing", () => {
    expect(visible(attackMenuEntries(actions()), "Hide Notes", SPEAR)).toBe(true);
  });

  test("notes that are hidden", () => {
    const menu = attackMenuEntries(actions({ notesShown: () => false }));

    expect([visible(menu, "Show Notes", SPEAR), visible(menu, "Hide Notes", SPEAR)]).toEqual([
      true,
      false,
    ]);
  });

  test("an attack with no notes", () => {
    const menu = attackMenuEntries(actions({ hasNotes: () => false }));

    expect([visible(menu, "Show Notes", SPEAR), visible(menu, "Hide Notes", SPEAR)]).toEqual([
      false,
      false,
    ]);
  });
});
