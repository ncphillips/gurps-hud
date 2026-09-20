import { describe, expect, it } from "vitest";
import { DESIGNED_RANGE_COLUMN_PX, READOUT_CHAR_WIDTH_PX, readoutWidth } from "./column-width";

const SPEAR_RANGE = "9/13";
const RIFLE_RANGE = "800/3,500";

describe("readoutWidth", () => {
  it("is the designed width when the longest value already fits", () => {
    expect(readoutWidth([SPEAR_RANGE, "—"], DESIGNED_RANGE_COLUMN_PX)).toBe(
      DESIGNED_RANGE_COLUMN_PX,
    );
  });

  it("is the longest value's own width when that is wider", () => {
    expect(readoutWidth([SPEAR_RANGE, RIFLE_RANGE], DESIGNED_RANGE_COLUMN_PX)).toBe(
      Math.ceil(RIFLE_RANGE.length * READOUT_CHAR_WIDTH_PX),
    );
  });

  it("is the designed width for a column with no values in it", () => {
    expect(readoutWidth([], DESIGNED_RANGE_COLUMN_PX)).toBe(DESIGNED_RANGE_COLUMN_PX);
  });
});
