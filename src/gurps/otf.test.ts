import { describe, expect, it, test } from "vitest";
import { attackOtf, isAttackOtf, quotedAttackName, skillOtf } from "./otf";

describe("quotedAttackName", () => {
  it("wraps a bare name in double quotes", () => {
    expect(quotedAttackName({ name: "Punch" })).toBe('"Punch"');
  });

  it("appends the usage mode in parentheses", () => {
    expect(quotedAttackName({ name: "Spear", mode: "Thrust" })).toBe('"Spear (Thrust)"');
  });

  test("a name containing a double quote", () => {
    expect(quotedAttackName({ name: '12" Blade' })).toBe("'12\" Blade'");
  });

  test("a double-quoted name that also contains a single quote", () => {
    expect(quotedAttackName({ name: `Bob's 12" Blade` })).toBe(`'Bob\\'s 12" Blade'`);
  });
});

describe("attackOtf", () => {
  it("prefixes a melee attack roll with M:", () => {
    expect(attackOtf("M", { name: "Spear", mode: "Thrust" })).toBe('M:"Spear (Thrust)"');
  });

  it("prefixes a ranged attack roll with R:", () => {
    expect(attackOtf("R", { name: "Spear", mode: "Thrown" })).toBe('R:"Spear (Thrown)"');
  });

  it("prefixes a parry roll with P:", () => {
    expect(attackOtf("P", { name: "Punch" })).toBe('P:"Punch"');
  });

  it("prefixes a block roll with B:", () => {
    expect(attackOtf("B", { name: "Shield" })).toBe('B:"Shield"');
  });

  it("prefixes a damage roll with D:", () => {
    expect(attackOtf("D", { name: "Kick" })).toBe('D:"Kick"');
  });
});

describe("skillOtf", () => {
  it("rolls the skill by quoted name", () => {
    expect(skillOtf("Brawling")).toBe('Sk:"Brawling"');
  });

  test("a skill name containing a double quote", () => {
    expect(skillOtf('Guns (12" Cannon)')).toBe("Sk:'Guns (12\" Cannon)'");
  });
});

describe("isAttackOtf", () => {
  it("recognises a melee attack roll", () => {
    expect(isAttackOtf('M:"Spear (Thrust)"')).toBe(true);
  });

  it("recognises a ranged attack roll", () => {
    expect(isAttackOtf('R:"Spear (Thrown)"')).toBe(true);
  });

  test("a damage roll", () => {
    expect(isAttackOtf('D:"Spear (Thrust)"')).toBe(false);
  });

  test("a skill roll", () => {
    expect(isAttackOtf('Sk:"Brawling"')).toBe(false);
  });
});
