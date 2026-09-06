import { describe, expect, it, test } from "vitest";
import {
  attrColumns,
  buildHudView,
  conditionVital,
  flattenList,
  isEquipped,
  meleeRows,
  poolTone,
  postureBadge,
  rangedRows,
  shockPenalty,
  skillRows,
} from "./hud-view";
import type { GurpsSystem } from "./system-types";

const localize = (key: string) => `[${key}]`;

function system(overrides: Partial<GurpsSystem> = {}): GurpsSystem {
  return {
    attributes: {
      ST: { value: 9 },
      DX: { value: 10 },
      IQ: { value: 12 },
      HT: { value: 11 },
      WILL: { value: 12 },
      PER: { value: 12 },
      QN: { value: 10 },
    },
    HP: { value: 20, max: 22 },
    FP: { value: 11, max: 11 },
    thrust: "1d-2",
    swing: "1d-1",
    basicspeed: { value: "5.25" },
    basicmove: { value: "5" },
    frightcheck: 12,
    vision: 12,
    hearing: 12,
    tastesmell: 12,
    touch: 12,
    currentmove: 5,
    currentdodge: 8,
    conditions: { posture: "standing", maneuver: "attack", reeling: false, exhausted: false },
    encumbrance: {},
    equipment: { carried: {}, other: {} },
    melee: {},
    ranged: {},
    skills: {},
    ...overrides,
  } as GurpsSystem;
}

describe("poolTone", () => {
  it("is ok while the pool is above a third of its maximum", () => {
    expect(poolTone(20, 22)).toBe("ok");
  });

  test("a pool at exactly a third of its maximum", () => {
    expect(poolTone(4, 12)).toBe("warn");
  });

  test("a pool at zero", () => {
    expect(poolTone(0, 12)).toBe("danger");
  });

  test("a pool below zero", () => {
    expect(poolTone(-3, 12)).toBe("danger");
  });
});

describe("postureBadge", () => {
  it("reads STANDING in the ok tone when upright", () => {
    expect(postureBadge("standing", localize)).toEqual({
      label: "[GURPS.status.Standing]",
      tone: "ok",
    });
  });

  test("kneeling", () => {
    expect(postureBadge("kneel", localize).tone).toBe("warn");
  });

  test("sitting", () => {
    expect(postureBadge("sit", localize).tone).toBe("warn");
  });

  test("crouching", () => {
    expect(postureBadge("crouch", localize).tone).toBe("warn");
  });

  test("prone", () => {
    expect(postureBadge("prone", localize).tone).toBe("danger");
  });

  test("crawling", () => {
    expect(postureBadge("crawl", localize).tone).toBe("danger");
  });
});

describe("shockPenalty", () => {
  it("is zero when the actor carries no shock status", () => {
    expect(shockPenalty(["reeling", "grapple"])).toBe(0);
  });

  test("the shock2 status", () => {
    expect(shockPenalty(["shock2"])).toBe(-2);
  });

  test("several shock statuses at once", () => {
    expect(shockPenalty(["shock1", "shock4"])).toBe(-4);
  });
});

describe("conditionVital", () => {
  it("is an em dash when the actor is neither reeling nor exhausted", () => {
    expect(conditionVital({ reeling: false, exhausted: false }).label).toBe("—");
  });

  test("reeling", () => {
    expect(conditionVital({ reeling: true, exhausted: false }).label).toBe("REELING");
  });

  test("exhausted", () => {
    expect(conditionVital({ reeling: false, exhausted: true }).label).toBe("TIRED");
  });

  test("reeling and exhausted at once", () => {
    expect(conditionVital({ reeling: true, exhausted: true }).label).toBe("RLNG+TIRED");
  });
});

describe("flattenList", () => {
  it("returns the top-level entries in order", () => {
    const list = { "00000": { name: "Spear" }, "00001": { name: "Knife" } };
    expect(flattenList(list).map((e) => e.name)).toEqual(["Spear", "Knife"]);
  });

  test("entries nested under contains", () => {
    const list = { "00000": { name: "Pack", contains: { "00000": { name: "Rations" } } } };
    expect(flattenList(list).map((e) => e.name)).toEqual(["Pack", "Rations"]);
  });

  test("an undefined list", () => {
    expect(flattenList(undefined)).toEqual([]);
  });
});

describe("isEquipped", () => {
  it("is true when carried equipment of that name is equipped", () => {
    const carried = { "00000": { name: "Spear", equipped: true } };
    expect(isEquipped("Spear", carried)).toBe(true);
  });

  it("matches an attack whose name extends the equipment name", () => {
    const carried = { "00000": { name: "Spear", equipped: true } };
    expect(isEquipped("Spear, Balanced", carried)).toBe(true);
  });

  test("equipment that is carried but not equipped", () => {
    const carried = { "00000": { name: "Spear", equipped: false } };
    expect(isEquipped("Spear", carried)).toBe(false);
  });

  test("an innate attack with no matching equipment", () => {
    const carried = { "00000": { name: "Spear", equipped: true } };
    expect(isEquipped("Punch", carried)).toBe(false);
  });
});

describe("meleeRows", () => {
  const spear = {
    name: "Spear",
    mode: "Thrust",
    level: 5,
    damage: "1d+1 imp",
    reach: "1-2",
    parry: "5",
    block: "",
  };

  it("joins the weapon name and usage mode with a middot", () => {
    expect(meleeRows(system({ melee: { "00000": spear } } as Partial<GurpsSystem>))[0].name).toBe(
      "Spear · Thrust",
    );
  });

  it("rolls the level against the melee attack", () => {
    expect(
      meleeRows(system({ melee: { "00000": spear } } as Partial<GurpsSystem>))[0].level.otf,
    ).toBe('M:"Spear (Thrust)"');
  });

  it("rolls the parry as a defence", () => {
    expect(
      meleeRows(system({ melee: { "00000": spear } } as Partial<GurpsSystem>))[0].parry.otf,
    ).toBe('P:"Spear (Thrust)"');
  });

  it("rolls the damage", () => {
    expect(
      meleeRows(system({ melee: { "00000": spear } } as Partial<GurpsSystem>))[0].damage.otf,
    ).toBe('D:"Spear (Thrust)"');
  });

  test("a weapon with nothing to block with", () => {
    expect(
      meleeRows(system({ melee: { "00000": spear } } as Partial<GurpsSystem>))[0].block,
    ).toEqual({
      text: "—",
      otf: null,
    });
  });

  test("a weapon whose parry is a fencing value", () => {
    const rapier = { ...spear, parry: "9F" };
    expect(
      meleeRows(system({ melee: { "00000": rapier } } as Partial<GurpsSystem>))[0].parry.text,
    ).toBe("9F");
  });

  test("a weapon with no usage mode", () => {
    expect(
      meleeRows(
        system({ melee: { "00000": { name: "Punch", level: 10 } } } as Partial<GurpsSystem>),
      )[0].name,
    ).toBe("Punch");
  });

  test("a weapon matching equipped gear", () => {
    const carried = { "00000": { name: "Spear", equipped: true } };
    expect(
      meleeRows(
        system({
          melee: { "00000": spear },
          equipment: { carried, other: {} },
        } as Partial<GurpsSystem>),
      )[0].equipped,
    ).toBe(true);
  });
});

describe("rangedRows", () => {
  const thrown = {
    name: "Spear",
    mode: "Thrown",
    level: 6,
    damage: "1d+1 imp",
    acc: "2",
    range: "9/13",
    rof: "1",
  };

  it("rolls the level against the ranged attack", () => {
    expect(
      rangedRows(system({ ranged: { "00000": thrown } } as Partial<GurpsSystem>))[0].level.otf,
    ).toBe('R:"Spear (Thrown)"');
  });

  it("reads the range straight off the attack", () => {
    expect(
      rangedRows(system({ ranged: { "00000": thrown } } as Partial<GurpsSystem>))[0].range,
    ).toBe("9/13");
  });

  it("rolls the damage", () => {
    expect(
      rangedRows(system({ ranged: { "00000": thrown } } as Partial<GurpsSystem>))[0].damage.otf,
    ).toBe('D:"Spear (Thrown)"');
  });
});

describe("attrColumns", () => {
  it("rolls Strength against the ST attribute", () => {
    expect(attrColumns(system()).basic.groups[0][0]).toEqual({
      label: "Strength (ST)",
      value: "9",
      otf: "ST",
    });
  });

  it("reads Basic Thrust off the actor without making it rollable", () => {
    expect(attrColumns(system()).basic.groups[1][0]).toEqual({
      label: "Basic Thrust",
      value: "1d-2",
      otf: null,
    });
  });

  it("rolls Fright Check by its Game Aid name", () => {
    expect(attrColumns(system()).secondary.groups[0][1].otf).toBe("Fright Check");
  });

  it("rolls Taste/Smell by its Game Aid name", () => {
    const touch = attrColumns(system()).secondary.groups[1];
    expect(touch.find((r) => r.label === "Taste/Smell")?.otf).toBe("Taste Smell");
  });
});

describe("meleeRows, given imperfect actor data", () => {
  test("an attack with no name", () => {
    const carried = { "00000": { name: "Spear", equipped: true } };
    const melee = { "00000": { level: 5, damage: "1d+1 imp" } };
    expect(
      meleeRows(system({ melee, equipment: { carried, other: {} } } as Partial<GurpsSystem>))[0]
        .equipped,
    ).toBe(false);
  });

  test("carried equipment with no name", () => {
    const carried = { "00000": { equipped: true } };
    expect(isEquipped("Spear", carried as never)).toBe(false);
  });

  test("a null entry in the melee list", () => {
    expect(meleeRows(system({ melee: { "00000": null } } as never))).toEqual([]);
  });
});

describe("buildHudView", () => {
  it("names the strip after the actor", () => {
    expect(buildHudView({ name: "Brent Mitton", system: system() }, localize).name).toBe(
      "Brent Mitton",
    );
  });

  test("an actor whose system data is missing the pieces the HUD reads", () => {
    expect(buildHudView({ name: "Mook", system: {} as GurpsSystem }, localize).melee).toEqual([]);
  });
});

describe("buildHudView, maneuver", () => {
  it("reports the maneuver the actor is performing", () => {
    const conditions = { posture: "standing", maneuver: "aoa_determined" };
    const actor = { name: "Brent", system: system({ conditions } as Partial<GurpsSystem>) };
    expect(buildHudView(actor, localize).maneuverId).toBe("aoa_determined");
  });

  /* The Game Aid only stores a maneuver during combat; outside it the value is the string "undefined". */
  test("an actor that is not in combat", () => {
    const conditions = { posture: "standing", maneuver: "undefined" };
    const actor = { name: "Brent", system: system({ conditions } as Partial<GurpsSystem>) };
    expect(buildHudView(actor, localize).maneuverId).toBeNull();
  });

  test("an actor whose conditions have no maneuver at all", () => {
    const actor = { name: "Brent", system: system({ conditions: { posture: "standing" } }) };
    expect(buildHudView(actor, localize).maneuverId).toBeNull();
  });
});

describe("skillRows", () => {
  it("builds a rollable row per skill", () => {
    const skills = { "00000": { name: "Brawling", level: 12, relativelevel: "DX+2" } };
    expect(skillRows(system({ skills }))).toEqual([
      {
        key: "skill-0",
        name: "Brawling",
        rsl: "DX+2",
        level: { text: "12", otf: 'Sk:"Brawling"' },
      },
    ]);
  });

  it("follows skills nested under a container", () => {
    const skills = {
      "00000": {
        name: "Combat",
        level: "",
        contains: { "00000": { name: "Knife", level: 10, relativelevel: "DX" } },
      },
    };
    expect(skillRows(system({ skills })).map((row) => row.name)).toEqual(["Combat", "Knife"]);
  });

  test("a container skill with no level", () => {
    const skills = { "00000": { name: "Combat", level: "" } };
    expect(skillRows(system({ skills }))[0].level).toEqual({ text: "—", otf: null });
  });

  test("a skill with no name", () => {
    const skills = { "00000": { name: "", level: 10 } };
    expect(skillRows(system({ skills }))).toEqual([]);
  });
});
