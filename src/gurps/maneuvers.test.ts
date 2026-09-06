import { describe, expect, it, test } from "vitest";
import { HUD_MANEUVERS, maneuverById } from "./maneuvers";

describe("HUD_MANEUVERS", () => {
  it("lists the twelve maneuvers the HUD offers", () => {
    expect(HUD_MANEUVERS).toHaveLength(12);
  });

  it("opens with Attack, the default maneuver", () => {
    expect(HUD_MANEUVERS[0]).toEqual({
      id: "attack",
      name: "Attack",
      hint: "1 action · Move ≤ 1 hex",
    });
  });

  it("uses the Game Aid's own maneuver ids", () => {
    expect(HUD_MANEUVERS.map((m) => m.id)).toEqual([
      "attack",
      "allout_attack",
      "move_and_attack",
      "allout_defense",
      "move",
      "change_posture",
      "aim",
      "evaluate",
      "feint",
      "ready",
      "concentrate",
      "wait",
    ]);
  });
});

describe("maneuverById", () => {
  it("finds the maneuver with that id", () => {
    expect(maneuverById("feint")?.name).toBe("Feint");
  });

  /*
   * The Game Aid knows maneuvers the HUD's menu does not -- every All-Out Attack variant, the On
   * Target additions -- and an actor can be performing one of them. Falling back to Attack would
   * quietly misreport what the actor is doing, so unknown ids resolve to nothing and the pill asks
   * the system for the real label instead.
   */
  test("an id the HUD does not offer", () => {
    expect(maneuverById("aoa_strong")).toBeUndefined();
  });

  test("an actor with no maneuver set", () => {
    expect(maneuverById("undefined")).toBeUndefined();
  });
});
