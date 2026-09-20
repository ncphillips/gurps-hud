/**
 * One character of a readout, in pixels. The readouts are JetBrains Mono at 10.5px, and that font
 * advances every glyph by the same 0.6em -- which is what makes a column's width a count of
 * characters rather than a measurement only the browser can take.
 */
export const READOUT_CHAR_WIDTH_PX = 6.3;

/** The width the range column was drawn at, which is what a thrown spear's "9/13" needs. */
export const DESIGNED_RANGE_COLUMN_PX = 30;

/**
 * How wide a readout column in the weapon tables has to be drawn to show its values whole: the
 * width it was designed at, unless the character on screen carries something longer than that.
 *
 * Every column was drawn at the width the design's character needed. A firearm's range is
 * "160/1,800", more than twice a thrown spear's "9/13", so at the designed width the value was
 * painted over the rate of fire beside it (issue #24). A column that asks for what its own values
 * need costs nothing to the character who carries none of them: the strip is `w-fit`, so it is only
 * ever as wide as the widest row in it.
 *
 * @param values Every value the column will hold for the character on screen.
 * @param designed The width the column was drawn at, which is the floor it never goes under.
 */
export function readoutWidth(values: string[], designed: number): number {
  const longest = values.reduce((widest, value) => Math.max(widest, value.length), 0);
  return Math.max(designed, Math.ceil(longest * READOUT_CHAR_WIDTH_PX));
}
