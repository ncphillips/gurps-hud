import { describe, expect, it, test } from "vitest";
import {
  attackKind,
  droppedAttack,
  dragPayload,
  isFromActor,
  noPicks,
  nudgePick,
  orderByPicks,
  placePick,
  readPicks,
  removePick,
} from "./attack-picks";

describe("attackKind", () => {
  it("reads melee off the key the character sheet drags", () => {
    expect(attackKind("system.melee.00000")).toBe("melee");
  });

  test("a ranged key", () => {
    expect(attackKind("system.ranged.00002")).toBe("ranged");
  });

  test("an attack nested under another", () => {
    expect(attackKind("system.melee.00000.contains.00001")).toBe("melee");
  });

  test("a key naming something that is not an attack", () => {
    expect(attackKind("system.skills.00000")).toBeNull();
  });
});

describe("droppedAttack", () => {
  it("reads the attack and the sheet it came from", () => {
    const payload = JSON.stringify({ actorid: "actor-bob", type: "melee", key: "system.melee.1" });

    expect(droppedAttack(payload)).toEqual({
      actorId: "actor-bob",
      kind: "melee",
      key: "system.melee.1",
    });
  });

  test("a skill dragged off the same sheet", () => {
    const payload = JSON.stringify({
      actorid: "actor-bob",
      type: "skills",
      key: "system.skills.1",
    });

    expect(droppedAttack(payload)).toBeNull();
  });

  test("a drag carrying no key at all", () => {
    expect(droppedAttack(JSON.stringify({ type: "Macro", uuid: "Macro.1" }))).toBeNull();
  });

  test("a payload that is not JSON", () => {
    expect(droppedAttack("Actor.4jKl")).toBeNull();
  });

  test("no payload at all", () => {
    expect(droppedAttack(undefined)).toBeNull();
  });

  it("round-trips the payload the HUD sets on its own drags", () => {
    const payload = dragPayload("actor-bob", "system.ranged.00001");

    expect(droppedAttack(payload)).toEqual({
      actorId: "actor-bob",
      kind: "ranged",
      key: "system.ranged.00001",
    });
  });
});

describe("isFromActor", () => {
  const dropped = (actorId: string | null) => ({
    actorId,
    kind: "melee" as const,
    key: "system.melee.0",
  });

  it("accepts an attack dragged off the strip's own actor's sheet", () => {
    expect(isFromActor(dropped("actor-bob"), "actor-bob")).toBe(true);
  });

  test("an attack dragged off somebody else's sheet", () => {
    expect(isFromActor(dropped("actor-greg"), "actor-bob")).toBe(false);
  });

  test("a payload naming no sheet at all", () => {
    expect(isFromActor(dropped(null), "actor-bob")).toBe(false);
  });

  test("a strip showing nobody", () => {
    expect(isFromActor(dropped("actor-bob"), null)).toBe(false);
  });
});

describe("placePick", () => {
  it("appends an attack to the group its key names", () => {
    const picks = { melee: ["system.melee.0"], ranged: [] };

    expect(placePick(picks, "system.melee.1", null).melee).toEqual([
      "system.melee.0",
      "system.melee.1",
    ]);
  });

  it("inserts an attack ahead of the one it was dropped on", () => {
    const picks = { melee: ["system.melee.0", "system.melee.1"], ranged: [] };

    expect(placePick(picks, "system.melee.2", "system.melee.1").melee).toEqual([
      "system.melee.0",
      "system.melee.2",
      "system.melee.1",
    ]);
  });

  it("moves an attack already in the list rather than duplicating it", () => {
    const picks = { melee: ["system.melee.0", "system.melee.1", "system.melee.2"], ranged: [] };

    expect(placePick(picks, "system.melee.2", "system.melee.0").melee).toEqual([
      "system.melee.2",
      "system.melee.0",
      "system.melee.1",
    ]);
  });

  test("a ranged attack dropped on a melee row", () => {
    const picks = { melee: ["system.melee.0"], ranged: ["system.ranged.0"] };

    expect(placePick(picks, "system.ranged.0", "system.melee.0")).toEqual(picks);
  });

  test("a key naming something that is not an attack", () => {
    const picks = noPicks();

    expect(placePick(picks, "system.skills.0", null)).toEqual(picks);
  });

  it("leaves the picks it was given untouched", () => {
    const picks = noPicks();
    placePick(picks, "system.melee.0", null);

    expect(picks.melee).toEqual([]);
  });
});

describe("removePick", () => {
  it("drops the attack from its group", () => {
    const picks = { melee: ["system.melee.0", "system.melee.1"], ranged: [] };

    expect(removePick(picks, "system.melee.0").melee).toEqual(["system.melee.1"]);
  });

  test("an attack that was never picked", () => {
    const picks = { melee: ["system.melee.0"], ranged: [] };

    expect(removePick(picks, "system.melee.9")).toEqual(picks);
  });
});

describe("nudgePick", () => {
  it("swaps an attack with the one below it", () => {
    const picks = { melee: ["system.melee.0", "system.melee.1"], ranged: [] };

    expect(nudgePick(picks, "system.melee.0", 1).melee).toEqual([
      "system.melee.1",
      "system.melee.0",
    ]);
  });

  test("the first attack nudged upwards", () => {
    const picks = { melee: ["system.melee.0", "system.melee.1"], ranged: [] };

    expect(nudgePick(picks, "system.melee.0", -1)).toEqual(picks);
  });

  test("the last attack nudged downwards", () => {
    const picks = { melee: ["system.melee.0", "system.melee.1"], ranged: [] };

    expect(nudgePick(picks, "system.melee.1", 1)).toEqual(picks);
  });
});

describe("orderByPicks", () => {
  it("returns the rows in the order they were picked", () => {
    const rows = [{ key: "a" }, { key: "b" }, { key: "c" }];

    expect(orderByPicks(rows, ["c", "a"])).toEqual([{ key: "c" }, { key: "a" }]);
  });

  test("a pick whose attack has left the sheet", () => {
    const rows = [{ key: "a" }];

    expect(orderByPicks(rows, ["gone", "a"])).toEqual([{ key: "a" }]);
  });

  test("nothing picked", () => {
    expect(orderByPicks([{ key: "a" }], [])).toEqual([]);
  });
});

describe("readPicks", () => {
  it("reads back the two groups the flag stores", () => {
    expect(readPicks({ melee: ["system.melee.0"], ranged: [] })).toEqual({
      melee: ["system.melee.0"],
      ranged: [],
    });
  });

  test("an actor that has never picked anything", () => {
    expect(readPicks(undefined)).toEqual(noPicks());
  });

  test("a flag holding something other than a list of keys", () => {
    expect(readPicks({ melee: "system.melee.0", ranged: [7] })).toEqual(noPicks());
  });
});
