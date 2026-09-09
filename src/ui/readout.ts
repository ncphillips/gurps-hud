/**
 * The vitals grid's value box. A class rather than a component because `PoolField` puts the same
 * geometry on a `<button>` and on the `<input>` it becomes when clicked: the box has to keep one
 * width and one baseline across that swap, or editing a pool nudges everything beside it.
 */
export const READOUT =
  "hud:flex-1 hud:rounded-hud-xs hud:bg-white/[.07] hud:px-[4px] hud:py-px hud:text-right hud:font-hud-mono hud:font-bold";

/**
 * Kept apart from `READOUT` so a box can pick one: a condition like "Reeling" has to drop to `sm`
 * to fit the same box a two-digit pool fills at `md`.
 */
export const READOUT_TEXT = {
  md: "hud:text-[12px]/[1.35]",
  sm: "hud:text-[9px]",
} as const;

export type ReadoutSize = keyof typeof READOUT_TEXT;
