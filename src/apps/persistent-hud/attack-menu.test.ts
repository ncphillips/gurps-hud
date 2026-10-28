import { describe, expect, it, vi } from "vitest";
import { attackMenuEntries } from "./attack-menu";
import type { AttackMenuActions } from "./attack-menu";

const SPEAR = "system.melee.00000";

function actions(overrides: Partial<AttackMenuActions> = {}): AttackMenuActions {
  return {
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

describe("attackMenuEntries", () => {
  it("removes the attack it was opened on", async () => {
    const remove = vi.fn();
    const menu = attackMenuEntries(actions({ remove }));

    await entry(menu, "Remove").onClick?.(new PointerEvent("click"), rowFor(SPEAR));

    expect(remove).toHaveBeenCalledWith(SPEAR);
  });
});
