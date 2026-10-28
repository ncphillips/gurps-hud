import { describe, expect, it, test } from "vitest";
import { notesShown, withNotesShown } from "./note-visibility";

const THOR = "thor";
const SPEAR = "system.melee.00000";

describe("notesShown", () => {
  it("follows the default for an attack nobody has toggled", () => {
    expect(notesShown({ shownByDefault: false, overrides: {} }, THOR, SPEAR)).toBe(false);
  });

  it("follows the reader's toggle over the default", () => {
    expect(
      notesShown({ shownByDefault: false, overrides: { [THOR]: { [SPEAR]: true } } }, THOR, SPEAR),
    ).toBe(true);
  });

  test("the same attack key on another actor", () => {
    expect(
      notesShown({ shownByDefault: true, overrides: { goblin: { [SPEAR]: false } } }, THOR, SPEAR),
    ).toBe(true);
  });

  test("an override that is not a boolean", () => {
    expect(
      notesShown({ shownByDefault: true, overrides: { [THOR]: { [SPEAR]: "no" } } }, THOR, SPEAR),
    ).toBe(true);
  });
});

describe("withNotesShown", () => {
  it("records a toggle away from the default", () => {
    expect(withNotesShown({ shownByDefault: true, overrides: {} }, THOR, SPEAR, false)).toEqual({
      [THOR]: { [SPEAR]: false },
    });
  });

  it("forgets a toggle back to the default", () => {
    expect(
      withNotesShown(
        { shownByDefault: true, overrides: { [THOR]: { [SPEAR]: false } } },
        THOR,
        SPEAR,
        true,
      ),
    ).toEqual({});
  });

  it("leaves the actor's other toggles alone", () => {
    const other = "system.ranged.00000";
    expect(
      withNotesShown(
        { shownByDefault: true, overrides: { [THOR]: { [other]: false } } },
        THOR,
        SPEAR,
        false,
      ),
    ).toEqual({ [THOR]: { [other]: false, [SPEAR]: false } });
  });
});
