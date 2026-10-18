import { describe, expect, it, test, vi } from "vitest";
import { setShock } from "./game-aid";
import type { GurpsActorLike } from "./system-types";

/** Records every status the HUD switches, as Foundry's `Actor#toggleStatusEffect` would apply them. */
function shockedActor(statuses: string[]) {
  const toggleStatusEffect = vi.fn(async () => true);
  const actor = { name: "Thor", system: {}, statuses, toggleStatusEffect } as unknown as GurpsActorLike;
  return { actor, toggleStatusEffect };
}

describe("setShock", () => {
  it("switches on the status for the chosen penalty", async () => {
    const { actor, toggleStatusEffect } = shockedActor([]);

    await setShock(actor, -2);

    expect(toggleStatusEffect).toHaveBeenCalledWith("shock2", { active: true });
  });

  it("switches off the shock status the actor already carries", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["shock3"]);

    await setShock(actor, -1);

    expect(toggleStatusEffect).toHaveBeenCalledWith("shock3", { active: false });
  });

  test("a penalty of zero", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["shock4"]);

    await setShock(actor, 0);

    expect(toggleStatusEffect.mock.calls).toEqual([["shock4", { active: false }]]);
  });

  it("leaves statuses other than shock alone", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["reeling", "shock1"]);

    await setShock(actor, -3);

    expect(toggleStatusEffect.mock.calls).toEqual([
      ["shock1", { active: false }],
      ["shock3", { active: true }],
    ]);
  });

  test("the penalty the actor already has", async () => {
    const { actor, toggleStatusEffect } = shockedActor(["shock2"]);

    await setShock(actor, -2);

    expect(toggleStatusEffect).not.toHaveBeenCalled();
  });
});
