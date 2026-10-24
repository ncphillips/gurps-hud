import { flushSync } from "svelte";
import { afterEach, describe, expect, it, test, vi } from "vitest";
import {
  addBucketModifier,
  attackPicks,
  currentActor,
  localize,
  notifyWarning,
  saveAttackPicks,
  targetedActor,
} from "@/gurps/game-aid";
import type { AttackPicks } from "@/gurps/attack-picks";
import type { GurpsActorLike } from "@/gurps/system-types";
import { MINIMIZED_HOOK } from "@/settings";
import { fixtureActor } from "./hud-fixture";
import { Hud } from "./hud.svelte";

vi.mock("@/gurps/game-aid");
vi.mock("@/log");
vi.mock("@/settings", async (original) => ({
  ...(await original<typeof import("@/settings")>()),
  currentMinimized: () => false,
  currentHudPosition: () => null,
}));

/** Foundry's hook bus, which is not here. Returns a way to fire a hook at whoever is listening. */
function stubHooks() {
  const handlers = new Map<string, Set<() => void>>();
  vi.stubGlobal("Hooks", {
    on: (hook: string, handler: () => void) => {
      if (!handlers.has(hook)) handlers.set(hook, new Set());
      handlers.get(hook)!.add(handler);
    },
    off: (hook: string, handler: () => void) => handlers.get(hook)?.delete(handler),
  });
  return (hook: string) => handlers.get(hook)?.forEach((handler) => handler());
}

/** The Game Aid with `actor` selected and `target` targeted, carrying `picks` on its flag. */
function stubGameAid({
  actor = null as GurpsActorLike | null,
  target = null as GurpsActorLike | null,
  picks = { melee: [], ranged: [] } as AttackPicks,
} = {}) {
  vi.mocked(currentActor).mockReturnValue(actor);
  vi.mocked(targetedActor).mockReturnValue(target);
  vi.mocked(attackPicks).mockReturnValue(picks);
  vi.mocked(localize).mockImplementation((key) => key);
  vi.mocked(saveAttackPicks).mockResolvedValue(undefined);
}

function actorNamed(id: string, name: string): GurpsActorLike {
  return { ...fixtureActor(), id, name };
}

/** A `Hud` with its hooks subscribed, as it would be inside the strip. */
function mountHud(): Hud {
  let hud!: Hud;
  cleanups.push(
    $effect.root(() => {
      hud = new Hud();
    }),
  );
  flushSync();
  return hud;
}

const cleanups: (() => void)[] = [];

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("which actor the strip shows", () => {
  test("selecting another token", () => {
    const fire = stubHooks();
    const greg = actorNamed("actor-greg", "Greg");
    stubGameAid({ actor: actorNamed("actor-bob", "Bob") });
    const hud = mountHud();

    vi.mocked(currentActor).mockReturnValue(greg);
    fire("controlToken");

    expect(hud.actor).toBe(greg);
  });

  test("selecting another token while locked", () => {
    const fire = stubHooks();
    const bob = actorNamed("actor-bob", "Bob");
    stubGameAid({ actor: bob });
    const hud = mountHud();

    hud.toggleLock();
    vi.mocked(currentActor).mockReturnValue(actorNamed("actor-greg", "Greg"));
    fire("controlToken");

    expect(hud.actor).toBe(bob);
  });

  test("unlocking", () => {
    stubHooks();
    const greg = actorNamed("actor-greg", "Greg");
    stubGameAid({ actor: actorNamed("actor-bob", "Bob") });
    const hud = mountHud();

    hud.toggleLock();
    vi.mocked(currentActor).mockReturnValue(greg);
    hud.toggleLock();

    expect(hud.actor).toBe(greg);
  });

  test("picking a character from the name menu while locked", () => {
    stubHooks();
    const greg = actorNamed("actor-greg", "Greg");
    stubGameAid({ actor: actorNamed("actor-bob", "Bob") });
    const hud = mountHud();

    hud.toggleLock();
    hud.selectActor({ key: "token-greg", name: "Greg", img: null, actor: greg });

    expect(hud.actor).toBe(greg);
  });
});

describe("Hud#view", () => {
  test("turning on the Game Aid's Use Quintessence setting", () => {
    const fire = stubHooks();
    const thor = { ...actorNamed("actor-thor", "Thor"), usingQuintessence: false };
    stubGameAid({ actor: thor });
    const hud = mountHud();
    // Read once, so the assertion is about a view that has to recompute rather than a first read.
    void hud.view;

    thor.usingQuintessence = true;
    fire("updateSetting");

    expect(hud.view.attrs.basic.groups[0].map((row) => row.label)).toContain("Quintessence (QN)");
  });
});

describe("the hit location aimed at", () => {
  test("targeting another token", () => {
    const fire = stubHooks();
    stubGameAid({ actor: fixtureActor(), target: actorNamed("actor-goblin", "Goblin") });
    const hud = mountHud();

    hud.selectTarget("Vitals");
    vi.mocked(targetedActor).mockReturnValue(actorNamed("actor-orc", "Orc"));
    fire("targetToken");

    expect(hud.target).toBe("Torso");
  });

  test("some other hook firing with the same target", () => {
    const fire = stubHooks();
    stubGameAid({ actor: fixtureActor(), target: actorNamed("actor-goblin", "Goblin") });
    const hud = mountHud();

    hud.selectTarget("Vitals");
    fire("updateActor");

    expect(hud.target).toBe("Vitals");
  });
});

describe("Hud#roll", () => {
  it("adds the aimed location's penalty to the bucket for an attack", () => {
    stubHooks();
    stubGameAid({ actor: fixtureActor(), target: actorNamed("actor-goblin", "Goblin") });
    const hud = mountHud();

    hud.selectTarget("Vitals");
    hud.roll("M:Spear", new MouseEvent("click"));

    expect(addBucketModifier).toHaveBeenCalledWith(-3, "to hit Vitals");
  });

  test("a roll that is not an attack", () => {
    stubHooks();
    stubGameAid({ actor: fixtureActor(), target: actorNamed("actor-goblin", "Goblin") });
    const hud = mountHud();

    hud.selectTarget("Vitals");
    hud.roll("S:Survival", new MouseEvent("click"));

    expect(addBucketModifier).not.toHaveBeenCalled();
  });

  test("an attack aimed at the torso", () => {
    stubHooks();
    stubGameAid({ actor: fixtureActor(), target: actorNamed("actor-goblin", "Goblin") });
    const hud = mountHud();

    hud.roll("M:Spear", new MouseEvent("click"));

    expect(addBucketModifier).not.toHaveBeenCalled();
  });
});

describe("Hud#placeAttack", () => {
  test("an attack dragged off another character's sheet", () => {
    stubHooks();
    stubGameAid({ actor: fixtureActor() });
    const hud = mountHud();

    hud.placeAttack({ actorId: "actor-greg", kind: "melee", key: "system.melee.00000" }, null);

    expect(saveAttackPicks).not.toHaveBeenCalled();
  });

  it("warns that the attack belongs to someone else", () => {
    stubHooks();
    stubGameAid({ actor: fixtureActor() });
    const hud = mountHud();

    hud.placeAttack({ actorId: "actor-greg", kind: "melee", key: "system.melee.00000" }, null);

    expect(notifyWarning).toHaveBeenCalled();
  });
});

describe("editing the picked attacks", () => {
  test("a second removal before the first write comes back", () => {
    stubHooks();
    stubGameAid({
      actor: fixtureActor(),
      picks: { melee: ["system.melee.00000", "system.melee.00001"], ranged: [] },
    });
    vi.mocked(saveAttackPicks).mockReturnValue(new Promise(() => {}));
    const hud = mountHud();

    hud.removeAttack("system.melee.00000");
    hud.removeAttack("system.melee.00001");

    expect(saveAttackPicks).toHaveBeenLastCalledWith(hud.actor, { melee: [], ranged: [] });
  });

  test("a removal before its write comes back", () => {
    stubHooks();
    stubGameAid({ actor: fixtureActor(), picks: { melee: ["system.melee.00000"], ranged: [] } });
    vi.mocked(saveAttackPicks).mockReturnValue(new Promise(() => {}));
    const hud = mountHud();

    hud.removeAttack("system.melee.00000");

    expect(hud.picks).toEqual({ melee: [], ranged: [] });
  });

  test("a write the server refuses", async () => {
    stubHooks();
    const saved = { melee: ["system.melee.00000"], ranged: [] };
    stubGameAid({ actor: fixtureActor(), picks: saved });
    vi.mocked(saveAttackPicks).mockRejectedValue(new Error("not yours"));
    const hud = mountHud();

    hud.removeAttack("system.melee.00000");
    await vi.waitFor(() => expect(hud.picks).toEqual(saved));
  });
});

test("minimizing the strip with a panel open", () => {
  const fire = stubHooks();
  stubGameAid({ actor: fixtureActor() });
  const hud = mountHud();

  hud.open("attrs");
  fire(MINIMIZED_HOOK);

  expect(hud.openPanel).toBeNull();
});

test("choosing a shock penalty", () => {
  stubHooks();
  stubGameAid({ actor: fixtureActor() });
  const hud = mountHud();

  hud.open("shock");
  hud.selectShock(-2);

  expect(hud.openPanel).toBeNull();
});
