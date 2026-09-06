/**
 * Interprets what a player typed into an HP or FP box. A bare number replaces the value; a signed
 * one adjusts it, so "-3" after taking a hit is the common case. Returns `null` when nothing should
 * change: garbage, an empty entry, or the value the pool already has.
 */
export function parsePoolEdit(input: string, current: number): number | null {
  const text = input.trim();
  if (!/^[+-]?\d+$/.test(text)) return null;

  const signed = /^[+-]/.test(text);
  const next = signed ? current + parseInt(text, 10) : parseInt(text, 10);
  return next === current ? null : next;
}
