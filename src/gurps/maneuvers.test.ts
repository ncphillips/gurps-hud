import { describe, expect, it, test } from "vitest";
import { HUD_MANEUVER_GROUPS, maneuverById } from "./maneuvers";

describe("HUD_MANEUVER_GROUPS", () => {
  it("opens with Attack, the default maneuver", () => {
    expect(HUD_MANEUVER_GROUPS[0].maneuvers[0]).toEqual({
      id: "attack",
      name: "Attack",
      hint: "1 action · Move ≤ 1 hex",
    });
  });

  it("heads the two groups that need one after the maneuver they narrow", () => {
    const headings = HUD_MANEUVER_GROUPS.map((group) => group.heading);
    expect(headings).toEqual([null, "All-Out Attack", "All-Out Defence"]);
  });

  it("uses the Game Aid's own maneuver ids", () => {
    const ids = HUD_MANEUVER_GROUPS.flatMap((group) => group.maneuvers.map((m) => m.id));
    expect(ids).toEqual([
      "attack",
      "move_and_attack",
      "move",
      "change_posture",
      "aim",
      "evaluate",
      "feint",
      "ready",
      "concentrate",
      "wait",
      "aoa_determined",
      "aoa_double",
      "aoa_strong",
      "aoa_feint",
      "aoa_ranged",
      "aoa_suppress",
      "aod_dodge",
      "aod_parry",
      "aod_block",
      "aod_double",
    ]);
  });

  it("labels a tile under a heading with the qualifier alone", () => {
    const allOutAttack = HUD_MANEUVER_GROUPS.find((g) => g.heading === "All-Out Attack");
    expect(allOutAttack?.maneuvers.map((m) => m.name)).toEqual([
      "Determined",
      "Double",
      "Strong",
      "Feint",
      "Ranged Determined",
      "Suppressing Fire",
    ]);
  });

  /*
   * The grid is two columns filled row-wise, so a group with an odd number of tiles would leave a
   * hole beside its last one and push the next heading half a row out of alignment.
   */
  it("fills whole rows, so every group holds an even number of tiles", () => {
    const odd = HUD_MANEUVER_GROUPS.filter((group) => group.maneuvers.length % 2 !== 0);
    expect(odd).toEqual([]);
  });
});

describe("maneuverById", () => {
  it("finds the maneuver with that id", () => {
    expect(maneuverById("feint")?.name).toBe("Feint");
  });

  /*
   * The tile reads "Strong" because its heading supplies the rest, but the pill has no heading to
   * lean on -- so it gets the name the system itself uses, and reads the same whether the HUD or
   * the token HUD set the maneuver.
   */
  it("names a maneuver under a heading after that heading", () => {
    expect(maneuverById("aoa_strong")?.name).toBe("All-Out Attack (Strong)");
  });

  it("keeps the maneuver's own hint", () => {
    expect(maneuverById("aod_dodge")?.hint).toBe("+2 to Dodge");
  });

  /*
   * The Game Aid knows maneuvers the HUD's menu does not -- plain All-Out Attack, the On Target
   * additions -- and an actor can be performing one of them. Falling back to Attack would quietly
   * misreport what the actor is doing, so unknown ids resolve to nothing and the pill asks the
   * system for the real label instead.
   */
  test("an id the HUD does not offer", () => {
    expect(maneuverById("committed_attack")).toBeUndefined();
  });

  test("an actor with no maneuver set", () => {
    expect(maneuverById("undefined")).toBeUndefined();
  });
});
