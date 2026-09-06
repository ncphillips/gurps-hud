import { describe, expect, it, test } from "vitest";
import { parsePoolEdit } from "./pool-edit";

describe("parsePoolEdit", () => {
  it("takes a bare number as the new value", () => {
    expect(parsePoolEdit("14", 20)).toBe(14);
  });

  it("applies a leading plus as a delta", () => {
    expect(parsePoolEdit("+3", 20)).toBe(23);
  });

  it("applies a leading minus as a delta", () => {
    expect(parsePoolEdit("-5", 20)).toBe(15);
  });

  it("allows a pool to go negative, as GURPS HP does", () => {
    expect(parsePoolEdit("-25", 20)).toBe(-5);
  });

  test("surrounding whitespace", () => {
    expect(parsePoolEdit("  7 ", 20)).toBe(7);
  });

  test("an unparseable entry", () => {
    expect(parsePoolEdit("lots", 20)).toBeNull();
  });

  test("an empty entry", () => {
    expect(parsePoolEdit("", 20)).toBeNull();
  });

  test("an unchanged value", () => {
    expect(parsePoolEdit("20", 20)).toBeNull();
  });
});
