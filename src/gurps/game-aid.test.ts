import { describe, expect, it, vi } from "vitest";
import { clearShock, toggleShock } from "./game-aid";
import type { GurpsActorLike } from "./system-types";

/** Records every status the HUD switches, as Foundry's `Actor#toggleStatusEffect` would apply them. */
function shockedActor(statuses: string[]) {
  const toggleStatusEffect = vi.fn(async () => true);
  const actor = { name: "Thor", system: {}, statuses, toggleStatusEffect } as unknown as GurpsActorLike;
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
