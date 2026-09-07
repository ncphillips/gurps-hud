import { describe, expect, it, test } from "vitest";
import en from "../lang/en.json";
import { t } from "./index";

describe("t", () => {
  it("returns the English string for a key", () => {
    expect(t("weapons.empty")).toBe("No attacks on this actor.");
  });

  it("substitutes the values a string's placeholders name", () => {
    expect(t("skills.roll", { name: "Spear" })).toBe("Roll against Spear");
  });

  /*
   * Foundry's translation table is shared by every module and system in the world, so an unprefixed
   * key would collide. The prefix is `t`'s job, which is why a call site names a key without it.
   */
  it("asks Foundry for the key under the module id", () => {
    expect(en["gurps-hud.weapons.empty"]).toBe(t("weapons.empty"));
  });
});

describe("the catalogue", () => {
  /*
   * Foundry resolves a dotted key by walking the translation table, so a catalogue that nested the
   * module id and then held dotted keys beneath it would silently resolve to nothing in a world
   * while still passing every test here.
   */
  it("is flat, so every key is one entry that can be grepped for", () => {
    const nested = Object.entries(en).filter(([, value]) => typeof value !== "string");
    expect(nested).toEqual([]);
  });

  it("prefixes every key with the module id", () => {
    const unprefixed = Object.keys(en).filter((key) => !key.startsWith("gurps-hud."));
    expect(unprefixed).toEqual([]);
  });
});

test("a key the catalogue does not have", () => {
  // @ts-expect-error -- the point of the key type: this is a compile error, not a runtime surprise.
  expect(t("weapons.nonexistent")).toBe("gurps-hud.weapons.nonexistent");
});
