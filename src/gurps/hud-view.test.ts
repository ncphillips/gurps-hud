import { describe, expect, it, test } from "vitest";
import {
  allAttackPicks,
  attrColumns,
  buildHudView,
  buildTargetView,
  conditionVital,
  emptyHudView,
  flattenKeyed,
  flattenList,
  hitLocationRows,
  isEquipped,
  meleeRows,
  poolTone,
  postureBadge,
  postureOptions,
  rangedRows,
  shockPenalty,
  skillRows,
  spellRows,
} from "./hud-view";
import type { AttrColumn } from "./hud-view";
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
    spells: {},
    hitlocations: {},
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

  /* The warn band runs all the way down to 1: danger is what a pool that is spent reads as. */
  test("a pool one point above zero", () => {
    expect(poolTone(1, 12)).toBe("warn");
  });

  test("a pool at zero", () => {
    expect(poolTone(0, 12)).toBe("danger");
  });

  test("a pool below zero", () => {
    expect(poolTone(-3, 12)).toBe("danger");
  });

  /* A sheet can carry a pool with no maximum, and a third of nothing would warn forever. */
  test("a pool with no maximum", () => {
    expect(poolTone(5, 0)).toBe("ok");
  });
});

describe("postureBadge", () => {
  it("reads STANDING in the ok tone when upright", () => {
    expect(postureBadge("standing", localize)).toEqual({
      id: "standing",
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

  it("carries the posture id so the badge can mark the current option", () => {
    expect(postureBadge("kneel", localize).id).toBe("kneel");
  });
});

/** The Game Aid's localizer, as far as its shock statuses go: the penalty is only in the translation. */
const gameAidLocalize = (key: string) =>
  ({
    "GURPS.modifierStatusShock3": "-3 to IQ/DX checks (Shock 3)",
    "GURPS.modifierStatusShock4": "-4 to IQ/DX checks (Shock 4)",
    "GURPS.modifierStatusStunned": "-4 to active defenses (Stunned)",
  })[key] ?? key;

const SHOCK3 = "GURPS.modifierStatusShock3 #shock3 #dx #iq #hit #spell #skill @combatmod";
const SHOCK4 = "GURPS.modifierStatusShock4 #shock4 #dx #iq #hit #spell #skill @combatmod";
const STUNNED = "GURPS.modifierStatusStunned #stun #defense @combatmod";

describe("shockPenalty", () => {
  it("is zero when the actor has no shock modifier", () => {
    expect(shockPenalty([STUNNED], gameAidLocalize)).toBe(0);
  });

  test("an actor with no self modifiers at all", () => {
    expect(shockPenalty(undefined, gameAidLocalize)).toBe(0);
  });

  test("one shock level", () => {
    expect(shockPenalty([SHOCK4], gameAidLocalize)).toBe(-4);
  });

  /* The Game Aid adds every shock level that is on to a roll, so the cell does too. */
  it("adds up every shock level that is on", () => {
    expect(shockPenalty([SHOCK4, STUNNED, SHOCK3], gameAidLocalize)).toBe(-7);
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

  it("carries the attack's notes, OtF buttons and all", () => {
    const sword = { ...spear, notes: "Swish ['Swing!'/anim slash]" };
    expect(
      meleeRows(system({ melee: { "00000": sword } } as Partial<GurpsSystem>))[0].notes,
    ).toBe("Swish ['Swing!'/anim slash]");
  });

  test("an attack with no notes", () => {
    expect(meleeRows(system({ melee: { "00000": spear } } as Partial<GurpsSystem>))[0].notes).toBe(
      "",
    );
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

  it("carries the attack's notes", () => {
    const bow = { ...thrown, notes: "[/anim arrow]" };
    expect(
      rangedRows(system({ ranged: { "00000": bow } } as Partial<GurpsSystem>))[0].notes,
    ).toBe("[/anim arrow]");
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

  it("adds the Acc to the bucket as a number", () => {
    expect(
      rangedRows(system({ ranged: { "00000": thrown } } as Partial<GurpsSystem>))[0].acc.mod,
    ).toBe(2);
  });

  it("names the Acc's weapon without its mode, as the sheet does", () => {
    expect(
      rangedRows(system({ ranged: { "00000": thrown } } as Partial<GurpsSystem>))[0].acc.weapon,
    ).toBe("Spear");
  });

  test("an Acc with a scope bonus", () => {
    const rifle = { ...thrown, acc: "5+2" };
    expect(
      rangedRows(system({ ranged: { "00000": rifle } } as Partial<GurpsSystem>))[0].acc.mod,
    ).toBe(5);
  });

  test("an Acc of 0", () => {
    const pistol = { ...thrown, acc: "0" };
    expect(
      rangedRows(system({ ranged: { "00000": pistol } } as Partial<GurpsSystem>))[0].acc.mod,
    ).toBeNull();
  });

  test("no Acc", () => {
    const sling = { ...thrown, acc: "" };
    expect(
      rangedRows(system({ ranged: { "00000": sling } } as Partial<GurpsSystem>))[0].acc.mod,
    ).toBeNull();
  });
});

describe("attrColumns", () => {
  /*
   * A row is looked up by its label rather than by where it sits, so which group a row is in stays
   * one claim made once -- below -- instead of a position every other test has to be rewritten for.
   */
  const rowIn = (column: AttrColumn, label: string) =>
    column.groups.flat().find((row) => row.label === label);

  it("rolls Strength against the ST attribute", () => {
    expect(rowIn(attrColumns(system()).basic, "Strength (ST)")).toEqual({
      label: "Strength (ST)",
      value: "9",
      otf: "ST",
    });
  });

  it("reads Basic Thrust off the actor without making it rollable", () => {
    expect(rowIn(attrColumns(system()).basic, "Basic Thrust")).toEqual({
      label: "Basic Thrust",
      value: "1d-2",
      otf: null,
    });
  });

  it("rolls Fright Check by its Game Aid name", () => {
    expect(rowIn(attrColumns(system()).secondary, "Fright Check")?.otf).toBe("Fright Check");
  });

  it("rolls Taste/Smell by its Game Aid name", () => {
    expect(rowIn(attrColumns(system()).secondary, "Taste/Smell")?.otf).toBe("Taste Smell");
  });

  /* Groups are rendered with a hairline between them, so the split is the panel's own layout. */
  it("separates the rollable basic attributes from the values derived off them", () => {
    const labels = attrColumns(system()).basic.groups.map((group) => group.map((row) => row.label));

    expect(labels).toEqual([
      ["Strength (ST)", "Dexterity (DX)", "Intelligence (IQ)", "Health (HT)"],
      ["Basic Thrust", "Basic Swing", "Basic Speed", "Basic Move"],
    ]);
  });

  it("rolls Quintessence against the QN attribute", () => {
    expect(rowIn(attrColumns(system(), { quintessence: true }).basic, "Quintessence (QN)")).toEqual(
      { label: "Quintessence (QN)", value: "10", otf: "QN" },
    );
  });

  it("lists Quintessence after Health when the Game Aid uses it", () => {
    const labels = attrColumns(system(), { quintessence: true }).basic.groups[0].map(
      (row) => row.label,
    );

    expect(labels).toEqual([
      "Strength (ST)",
      "Dexterity (DX)",
      "Intelligence (IQ)",
      "Health (HT)",
      "Quintessence (QN)",
    ]);
  });

  it("separates Will and Fright Check from the senses", () => {
    const labels = attrColumns(system()).secondary.groups.map((group) =>
      group.map((row) => row.label),
    );

    expect(labels).toEqual([
      ["Will", "Fright Check"],
      ["Perception (Per)", "Vision", "Hearing", "Taste/Smell", "Touch"],
    ]);
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
    expect(buildHudView({ name: "Thor Odinson", system: system() }, localize).name).toBe(
      "Thor Odinson",
    );
  });

  it("shows Quintessence when the Game Aid uses it", () => {
    const actor = { name: "Thor", system: system(), usingQuintessence: true };
    const labels = buildHudView(actor, localize)
      .attrs.basic.groups.flat()
      .map((row) => row.label);

    expect(labels).toContain("Quintessence (QN)");
  });

  it("leaves Quintessence out when the Game Aid does not use it", () => {
    const actor = { name: "Thor", system: system(), usingQuintessence: false };
    const labels = buildHudView(actor, localize)
      .attrs.basic.groups.flat()
      .map((row) => row.label);

    expect(labels).not.toContain("Quintessence (QN)");
  });

  it("reads Quintessence Points as a pool when the Game Aid uses Quintessence", () => {
    const qp = { value: 3, max: 10 };
    const actor = { name: "Thor", system: system({ QP: qp }), usingQuintessence: true };

    expect(buildHudView(actor, localize).qp).toEqual({ value: "3", max: "10", tone: "warn" });
  });

  test("Quintessence Points on an actor that was never given any", () => {
    const qp = { value: 0, max: 0 };
    const actor = { name: "Goblin", system: system({ QP: qp }), usingQuintessence: true };

    expect(buildHudView(actor, localize).qp).toEqual({ value: "—", max: "—", tone: "ok" });
  });

  it("has no Quintessence Points when the Game Aid does not use Quintessence", () => {
    const qp = { value: 3, max: 10 };
    const actor = { name: "Thor", system: system({ QP: qp }), usingQuintessence: false };

    expect(buildHudView(actor, localize).qp).toBeNull();
  });

  test("an actor whose system data is missing the pieces the HUD reads", () => {
    expect(buildHudView({ name: "Mook", system: {} as GurpsSystem }, localize).melee).toEqual([]);
  });
});

describe("buildHudView, shock", () => {
  it("offers each shock level, mildest first", () => {
    const view = buildHudView({ name: "Thor", system: system({}) }, localize);
    expect(view.shocks.map((level) => level.penalty)).toEqual([-1, -2, -3, -4]);
  });

  it("marks the shock levels the actor has on", () => {
    const actor = { name: "Thor", system: system({}), statuses: ["shock4", "reeling", "shock3"] };
    expect(buildHudView(actor, localize).shocks.map((level) => level.on)).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it("shows the shock penalty the Game Aid applies to rolls", () => {
    const conditions = { posture: "standing", self: { modifiers: [SHOCK4, SHOCK3] } };
    const actor = { name: "Thor", system: system({ conditions } as Partial<GurpsSystem>) };
    expect(buildHudView(actor, gameAidLocalize).shock).toBe(-7);
  });
});

describe("buildHudView, maneuver", () => {
  it("reports the maneuver the actor is performing", () => {
    const conditions = { posture: "standing", maneuver: "aoa_determined" };
    const actor = { name: "Thor", system: system({ conditions } as Partial<GurpsSystem>) };
    expect(buildHudView(actor, localize).maneuverId).toBe("aoa_determined");
  });

  /* The Game Aid only stores a maneuver during combat; outside it the value is the string "undefined". */
  test("an actor that is not in combat", () => {
    const conditions = { posture: "standing", maneuver: "undefined" };
    const actor = { name: "Thor", system: system({ conditions } as Partial<GurpsSystem>) };
    expect(buildHudView(actor, localize).maneuverId).toBeNull();
  });

  test("an actor whose conditions have no maneuver at all", () => {
    const actor = { name: "Thor", system: system({ conditions: { posture: "standing" } }) };
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

describe("spellRows", () => {
  it("builds a rollable row per spell", () => {
    const spells = { "00000": { name: "Lightning", level: 14 } };
    expect(spellRows(system({ spells }))[0].level).toEqual({ text: "14", otf: 'Sp:"Lightning"' });
  });

  it("keys each row by its path on the actor", () => {
    const spells = { "00000": { name: "Lightning", level: 14 } };
    expect(spellRows(system({ spells }))[0].key).toBe("system.spells.00000");
  });

  it("carries what casting it costs", () => {
    const spells = {
      "00000": {
        name: "Lightning",
        level: 14,
        cost: "1 to 3",
        maintain: "",
        casttime: "1-3 sec",
        duration: "Instant",
      },
    };
    expect(spellRows(system({ spells }))[0]).toMatchObject({
      cost: "1 to 3",
      maintain: "—",
      time: "1-3 sec",
      duration: "Instant",
    });
  });

  it("follows spells nested under a college", () => {
    const spells = {
      "00000": {
        name: "Air",
        level: "",
        contains: { "00000": { name: "Shape Air", level: 13 } },
      },
    };
    expect(spellRows(system({ spells })).map((row) => row.name)).toEqual(["Air", "Shape Air"]);
  });

  test("a college with no level", () => {
    const spells = { "00000": { name: "Air", level: "" } };
    expect(spellRows(system({ spells }))[0].level).toEqual({ text: "—", otf: null });
  });

  test("a spell with no name", () => {
    const spells = { "00000": { name: "", level: 10 } };
    expect(spellRows(system({ spells }))).toEqual([]);
  });

  test("an actor whose sheet has no spell list", () => {
    expect(spellRows(system({ spells: undefined }))).toEqual([]);
  });
});

describe("postureOptions", () => {
  it("lists every posture the Game Aid tracks, standing first", () => {
    expect(postureOptions(localize).map((option) => option.id)).toEqual([
      "standing",
      "crouch",
      "kneel",
      "sit",
      "crawl",
      "prone",
    ]);
  });

  it("labels each option with the Game Aid's own status name", () => {
    expect(postureOptions(localize)[5].label).toBe("[GURPS.status.Prone]");
  });
});

describe("hitLocationRows", () => {
  it("builds a row per location with its to-hit penalty as a number", () => {
    const hitlocations = { "00000": { where: "Face", penalty: "-5", dr: "0", roll: "5" } };
    expect(hitLocationRows(system({ hitlocations }))).toEqual([
      { key: "loc-0", where: "Face", penalty: -5, dr: "0", roll: "5" },
    ]);
  });

  test("a location with a blank penalty", () => {
    const hitlocations = { "00000": { where: "Torso", penalty: "", dr: "2", roll: "9-10" } };
    expect(hitLocationRows(system({ hitlocations }))[0].penalty).toBe(0);
  });

  test("a location with no name", () => {
    const hitlocations = { "00000": { where: "", penalty: "-2", dr: "0", roll: "" } };
    expect(hitLocationRows(system({ hitlocations }))).toEqual([]);
  });
});

describe("buildTargetView", () => {
  it("is null with nothing targeted", () => {
    expect(buildTargetView(null)).toBeNull();
  });

  it("names the targeted actor", () => {
    const hitlocations = { "00000": { where: "Torso", penalty: "0", dr: "1", roll: "9-10" } };
    expect(buildTargetView({ name: "Goblin Grunt", system: system({ hitlocations }) })?.name).toBe(
      "Goblin Grunt",
    );
  });

  it("lists the targeted actor's own hit locations", () => {
    const hitlocations = { "00000": { where: "Wing", penalty: "-2", dr: "0", roll: "6-7" } };
    expect(
      buildTargetView({ name: "Bat", system: system({ hitlocations }) })?.hitLocations.map(
        (location) => location.where,
      ),
    ).toEqual(["Wing"]);
  });
});

describe("emptyHudView", () => {
  it("asks for an actor in place of a character name", () => {
    expect(emptyHudView().name).toBe("Select Actor");
  });

  it("has no portrait", () => {
    expect(emptyHudView().img).toBeNull();
  });

  it("blanks the posture badge rather than claiming the actor is standing", () => {
    expect(emptyHudView().posture.label).toBe("—");
  });

  it("offers no posture to change to", () => {
    expect(emptyHudView().postures).toEqual([]);
  });

  it("blanks hit points", () => {
    expect(emptyHudView().hp).toEqual({ value: "—", max: "—", tone: "ok" });
  });

  it("blanks fatigue points", () => {
    expect(emptyHudView().fp).toEqual({ value: "—", max: "—", tone: "ok" });
  });

  it("has no shock penalty to report", () => {
    expect(emptyHudView().shock).toBeNull();
  });

  it("offers no shock penalty to change to", () => {
    expect(emptyHudView().shocks).toEqual([]);
  });

  it("blanks the condition cell", () => {
    expect(emptyHudView().condition.label).toBe("—");
  });

  it("has no Quintessence Points", () => {
    expect(emptyHudView().qp).toBeNull();
  });

  it("blanks Dodge", () => {
    expect(emptyHudView().dodge).toBe("—");
  });

  it("blanks Move", () => {
    expect(emptyHudView().move).toBe("—");
  });

  it("blanks every attribute value", () => {
    const values = emptyHudView()
      .attrs.basic.groups.flat()
      .map((attr) => attr.value);
    expect(values).toEqual(["", "", "", "", "", "", "", ""]);
  });

  it("lists no attacks", () => {
    expect(emptyHudView().melee).toEqual([]);
  });

  it("lists no skills", () => {
    expect(emptyHudView().skills).toEqual([]);
  });

  it("lists no spells", () => {
    expect(emptyHudView().spells).toEqual([]);
  });

  it("has no maneuver", () => {
    expect(emptyHudView().maneuverId).toBeNull();
  });
});

describe("flattenKeyed", () => {
  it("pairs each entry with the key path the character sheet drags", () => {
    const list = { "00000": { name: "Spear" } };
    expect(flattenKeyed(list, "system.melee.")).toEqual([
      ["system.melee.00000", { name: "Spear" }],
    ]);
  });

  test("an entry nested under another", () => {
    const list = { "00000": { name: "Spear", contains: { "00001": { name: "Butt" } } } };
    expect(flattenKeyed(list, "system.melee.")[1][0]).toBe("system.melee.00000.contains.00001");
  });
});

describe("meleeRows, keys", () => {
  it("keys a row by the path the character sheet drags", () => {
    const melee = { "00007": { name: "Spear", mode: "Thrust" } };
    expect(meleeRows(system({ melee } as Partial<GurpsSystem>))[0].key).toBe("system.melee.00007");
  });
});

describe("rangedRows, keys", () => {
  it("keys a row by the path the character sheet drags", () => {
    const ranged = { "00007": { name: "Bow" } };
    expect(rangedRows(system({ ranged } as Partial<GurpsSystem>))[0].key).toBe(
      "system.ranged.00007",
    );
  });
});

describe("allAttackPicks", () => {
  it("picks every attack on the sheet, in the sheet's own order", () => {
    const melee = { "00000": { name: "Spear" }, "00001": { name: "Punch" } };
    const ranged = { "00000": { name: "Bow" } };

    expect(allAttackPicks(system({ melee, ranged } as Partial<GurpsSystem>))).toEqual({
      melee: ["system.melee.00000", "system.melee.00001"],
      ranged: ["system.ranged.00000"],
    });
  });
});

describe("buildHudView, picked attacks", () => {
  const melee = { "00000": { name: "Spear" }, "00001": { name: "Punch" } };
  const actor = () => ({ name: "Thor", system: system({ melee } as Partial<GurpsSystem>) });

  it("shows only the attacks that were picked, in the order they were picked", () => {
    const picks = { melee: ["system.melee.00001", "system.melee.00000"], ranged: [] };

    expect(buildHudView(actor(), localize, picks).melee.map((row) => row.name)).toEqual([
      "Punch",
      "Spear",
    ]);
  });

  test("an actor whose attacks have never been picked", () => {
    expect(buildHudView(actor(), localize).melee).toEqual([]);
  });

  it("reports that the actor has attacks to pick from even when none are picked", () => {
    expect(buildHudView(actor(), localize).hasAttacks).toBe(true);
  });

  test("an actor with no attacks at all", () => {
    const bare = { name: "Mook", system: system({ melee: {}, ranged: {} }) };

    expect(buildHudView(bare, localize).hasAttacks).toBe(false);
  });
});
