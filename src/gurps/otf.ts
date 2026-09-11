/**
 * On-The-Fly (OTF) strings are the Game Aid's own roll protocol: `M:"Spear (Thrust)"` rolls that
 * melee attack, `ST` rolls Strength. Building the same strings the system's sheets build means the
 * HUD inherits every roll behaviour -- modifier bucket, targets, chat cards -- for free.
 */

const DOUBLE_QUOTE = '"';
const SINGLE_QUOTE = "'";

/**
 * What a character the OTF grammar cannot carry is replaced with. The Game Aid picks the same
 * character: `parselink` rewrites every `\"` and `\'` to `*` before it parses anything, so a name
 * it cannot quote already reaches the roll with an asterisk where the quote was.
 */
const UNQUOTABLE = "*";

/**
 * Characters that escape a quoted name no matter which quote encloses it. `|` splits a second,
 * fully parsed action off the OTF (`Sk:"a|/r 3d6"` rolls the 3d6), and the split happens before the
 * parser reads a quote. A backslash never escapes anything -- the grammar has no escape syntax --
 * but one at the end of a name would be paired with the closing quote we add and collapsed to `*`,
 * leaving the name unterminated and its tail parsed as OTF.
 */
const OTF_SYNTAX = /[|\\]/g;

export interface AttackRef {
  name?: string;
  mode?: string;
}

/** `M` melee · `R` ranged · `P` parry · `B` block · `D` damage. */
export type AttackOtfPrefix = "M" | "R" | "P" | "B" | "D";

/**
 * Mirrors the Game Aid's own quoting, so names with quotes in them still parse. A name is enclosed
 * in whichever quote it does not contain -- the grammar reads a quoted name as `"[^"]+"` or
 * `'[^']+'`, with no escape sequence inside either -- and anything that would still end the name
 * early is replaced rather than escaped. Replacing costs the lookup that one name, exactly as the
 * Game Aid's own `*` does; escaping would let the rest of the name run on as OTF syntax.
 */
function quotedName(name: string): string {
  const safe = name.replace(OTF_SYNTAX, UNQUOTABLE);

  if (safe.includes(DOUBLE_QUOTE)) {
    return SINGLE_QUOTE + safe.replaceAll(SINGLE_QUOTE, UNQUOTABLE) + SINGLE_QUOTE;
  }

  return DOUBLE_QUOTE + safe + DOUBLE_QUOTE;
}

export function quotedAttackName(attack: AttackRef): string {
  const base = attack.name ?? "";
  return quotedName(base && attack.mode ? `${base} (${attack.mode})` : base);
}

/** `Sk:"Brawling"` -- the string the Game Aid's own sheet emits for a skill roll. */
export function skillOtf(name: string): string {
  return `Sk:${quotedName(name)}`;
}

export function attackOtf(prefix: AttackOtfPrefix, attack: AttackRef): string {
  return `${prefix}:${quotedAttackName(attack)}`;
}

/** Whether an OTF is an attack *roll* -- the one place a targeted hit location's penalty belongs. */
export function isAttackOtf(otf: string): boolean {
  return /^[MR]:/.test(otf);
}
