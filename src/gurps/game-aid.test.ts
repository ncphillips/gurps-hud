import { afterEach, describe, expect, it, test, vi } from "vitest";
import { clearShock, editAttack, toggleShock } from "./game-aid";
import type { GurpsActorLike } from "./system-types";

/** Records every status the HUD switches, as Foundry's `Actor#toggleStatusEffect` would apply them. */
function shockedActor(statuses: string[]) {
  const toggleStatusEffect = vi.fn(async () => true);
  const actor = {
    name: "Thor",
    system: {},
    statuses,
    toggleStatusEffect,
  } as unknown as GurpsActorLike;
  return { actor, toggleStatusEffect };
}

describe("toggleShock", () => {
  it("switches a shock level on when the actor does not have it", async () => {
    const { actor, toggleStatusEffect } = shockedActor([]);

    await toggleShock(actor, -2);

    expect(toggleStatusEffect).toHaveBeenCalledWith("shock2", { active: true });
  });

  it("switches a shock level off when the actor has it", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["shock2"]);

    await toggleShock(actor, -2);

    expect(toggleStatusEffect).toHaveBeenCalledWith("shock2", { active: false });
  });

  it("leaves the actor's other shock levels on", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["shock4"]);

    await toggleShock(actor, -3);

    expect(toggleStatusEffect.mock.calls).toEqual([["shock3", { active: true }]]);
  });
});

describe("clearShock", () => {
  it("switches off every shock level the actor has on", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["shock4", "shock3"]);

    await clearShock(actor);

    expect(toggleStatusEffect.mock.calls).toEqual([
      ["shock4", { active: false }],
      ["shock3", { active: false }],
    ]);
  });

  it("leaves statuses other than shock alone", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["reeling", "shock1"]);

    await clearShock(actor);

    expect(toggleStatusEffect.mock.calls).toEqual([["shock1", { active: false }]]);
  });
});

/**
 * Foundry's own path helpers, as the Game Aid's sheet uses them to read an attack off the actor. The
 * duplicate matters: the sheet's editor compares what it was handed against what it saves.
 */
function stubFoundryUtils() {
  vi.stubGlobal("foundry", {
    utils: {
      getProperty: (object: object, path: string) =>
        path
          .split(".")
          .reduce<unknown>((at, part) => (at as Record<string, unknown>)?.[part], object),
      duplicate: <T>(value: T): T => structuredClone(value),
    },
  });
}

/** An actor whose sheet is the Game Aid's, which is where both weapon editors live. */
function armedActor(system: object, items: Record<string, object> = {}) {
  const editMelee = vi.fn(async (_actor: unknown, _key: string, _attack: object) => {});
  const editRanged = vi.fn(async (_actor: unknown, _key: string, _attack: object) => {});
  const sanityCheck = vi.fn(async () => true);
  const actor = {
    name: "Thor",
    system,
    sheet: { render: vi.fn(), editMelee, editRanged },
    items: { get: (id: string) => items[id] },
    _sanityCheckItemSettings: sanityCheck,
  } as unknown as GurpsActorLike;
  return { actor, editMelee, editRanged, sanityCheck };
}

describe("editAttack", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the Melee Weapon Editor for a melee attack", async () => {
    stubFoundryUtils();
    const spear = { name: "Spear", mode: "Thrust" };
    const { actor, editMelee } = armedActor({ melee: { "00000": spear } });

    await editAttack(actor, "system.melee.00000");

    expect(editMelee).toHaveBeenCalledWith(actor, "system.melee.00000", spear);
  });

  it("opens the Ranged Weapon Editor for a ranged attack", async () => {
    stubFoundryUtils();
    const spear = { name: "Spear", mode: "Thrown" };
    const { actor, editRanged } = armedActor({ ranged: { "00000": spear } });

    await editAttack(actor, "system.ranged.00000");

    expect(editRanged).toHaveBeenCalledWith(actor, "system.ranged.00000", spear);
  });

  it("hands the editor a copy of the attack, not the actor's own", async () => {
    stubFoundryUtils();
    const spear = { name: "Spear", mode: "Thrust" };
    const { actor, editMelee } = armedActor({ melee: { "00000": spear } });

    await editAttack(actor, "system.melee.00000");

    expect(editMelee.mock.calls[0][2]).not.toBe(spear);
  });

  it("opens the item's sheet for an attack that comes from an item", async () => {
    stubFoundryUtils();
    const item = { system: {}, sheet: { render: vi.fn() } };
    const { actor } = armedActor(
      { melee: { "00000": { name: "Spear", itemid: "item-spear" } } },
      { "item-spear": item },
    );

    await editAttack(actor, "system.melee.00000");

    expect(item.sheet.render).toHaveBeenCalledWith(true);
  });

  it("tells the item's sheet whose attack it is editing", async () => {
    stubFoundryUtils();
    const item: { system: object; sheet: { render(): void }; editingActor?: unknown } = {
      system: {},
      sheet: { render: vi.fn() },
    };
    const { actor } = armedActor(
      { melee: { "00000": { name: "Spear", itemid: "item-spear" } } },
      { "item-spear": item },
    );

    await editAttack(actor, "system.melee.00000");

    expect(item.editingActor).toBe(actor);
  });

  it("opens the sheet of the item an attack's item was made from", async () => {
    stubFoundryUtils();
    const parent = { system: {}, sheet: { render: vi.fn() } };
    const child = { system: { fromItem: "item-parent" }, sheet: { render: vi.fn() } };
    const { actor } = armedActor(
      { melee: { "00000": { name: "Spear", itemid: "item-child" } } },
      { "item-child": child, "item-parent": parent },
    );

    await editAttack(actor, "system.melee.00000");

    expect(parent.sheet.render).toHaveBeenCalledWith(true);
  });

  test("an item the Game Aid's settings say may not be edited here", async () => {
    stubFoundryUtils();
    const item = { system: {}, sheet: { render: vi.fn() } };
    const { actor, sanityCheck } = armedActor(
      { melee: { "00000": { name: "Spear", itemid: "item-spear" } } },
      { "item-spear": item },
    );
    sanityCheck.mockResolvedValue(false);

    await editAttack(actor, "system.melee.00000");

    expect(item.sheet.render).not.toHaveBeenCalled();
  });
});
