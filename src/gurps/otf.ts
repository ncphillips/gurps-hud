/**
 * On-The-Fly (OTF) strings are the Game Aid's own roll protocol: `M:"Spear (Thrust)"` rolls that
 * melee attack, `ST` rolls Strength. Building the same strings the system's sheets build means the
 * HUD inherits every roll behaviour -- modifier bucket, targets, chat cards -- for free.
 */

const DOUBLE_QUOTE = '"';
const SINGLE_QUOTE = "'";

export interface AttackRef {
  name?: string;
  mode?: string;
}

/** `M` melee · `R` ranged · `P` parry · `B` block · `D` damage. */
export type AttackOtfPrefix = "M" | "R" | "P" | "B" | "D";

/** Mirrors the Game Aid's own `quotedAttackName`, so names with quotes in them still parse. */
export function quotedAttackName(attack: AttackRef): string {
  const base = attack.name ?? "";
  const name = base && attack.mode ? `${base} (${attack.mode})` : base;

  if (name.includes(DOUBLE_QUOTE)) {
    return SINGLE_QUOTE + name.replace(/'/g, "\\'") + SINGLE_QUOTE;
  }

  return DOUBLE_QUOTE + name + DOUBLE_QUOTE;
}

export function attackOtf(prefix: AttackOtfPrefix, attack: AttackRef): string {
  return `${prefix}:${quotedAttackName(attack)}`;
}
