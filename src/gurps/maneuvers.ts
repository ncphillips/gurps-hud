/**
 * The maneuvers the HUD offers, as the design lays them out: one two-column grid filled row-wise,
 * broken into groups. The Game Aid knows more than these -- the On Target additions -- but the HUD
 * trades completeness for a menu you can read in one glance.
 *
 * All-Out Attack and All-Out Defence each come in several flavours (B365-366), which the Game Aid
 * stores as maneuvers in their own right. They sit in the grid like any other maneuver, under a
 * heading that carries the part of the name they share, so choosing one is a single click. Both
 * headed groups sit at the foot of the grid so the ten plain maneuvers -- the common case -- stay
 * unbroken at the top. The unqualified parents are deliberately absent: GURPS makes you say which
 * kind you are performing.
 */

export interface HudManeuver {
  /** The Game Aid's own maneuver id, as stored in `system.conditions.maneuver`. */
  id: string;
  /** The tile's label. Under a heading this is the qualifier alone -- "Strong". */
  name: string;
  hint: string;
}

export interface HudManeuverGroup {
  /** The label above this run of tiles, or `null` for the maneuvers that need no introduction. */
  heading: string | null;
  maneuvers: readonly HudManeuver[];
}

export const HUD_MANEUVER_GROUPS: readonly HudManeuverGroup[] = [
  {
    heading: null,
    maneuvers: [
      { id: "attack", name: "Attack", hint: "1 action · Move ≤ 1 hex" },
      { id: "move_and_attack", name: "Move and Attack", hint: "−4 to hit, skill 9 max" },
      { id: "move", name: "Move", hint: "full Move, no attack" },
      { id: "change_posture", name: "Change Posture", hint: "stand, kneel, prone, sit" },
      { id: "aim", name: "Aim", hint: "+Acc on next ranged attack" },
      { id: "evaluate", name: "Evaluate", hint: "+1 per turn, max +3" },
      { id: "feint", name: "Feint", hint: "Quick Contest of skill" },
      { id: "ready", name: "Ready", hint: "draw or ready a weapon" },
      { id: "concentrate", name: "Concentrate", hint: "one mental task" },
      { id: "wait", name: "Wait", hint: "act on a trigger" },
    ],
  },
  {
    heading: "All-Out Attack",
    maneuvers: [
      { id: "aoa_determined", name: "Determined", hint: "+4 to hit · no defence" },
      { id: "aoa_double", name: "Double", hint: "two attacks · no defence" },
      { id: "aoa_strong", name: "Strong", hint: "+2 damage, or +1 per die" },
      { id: "aoa_feint", name: "Feint", hint: "feint, then attack" },
      { id: "aoa_ranged", name: "Ranged Determined", hint: "+1 to hit · no Move" },
      { id: "aoa_suppress", name: "Suppressing Fire", hint: "RoF 5+ · spray an area" },
    ],
  },
  {
    heading: "All-Out Defence",
    maneuvers: [
      { id: "aod_dodge", name: "Dodge", hint: "+2 to Dodge" },
      { id: "aod_parry", name: "Parry", hint: "+2 to Parry" },
      { id: "aod_block", name: "Block", hint: "+2 to Block" },
      { id: "aod_double", name: "Double", hint: "two defences against one attack" },
    ],
  },
];

/**
 * Returns nothing for a maneuver this menu doesn't list. An actor can legitimately be performing one
 * the Game Aid knows and we don't -- unqualified All-Out Attack, or Committed Attack chosen from the
 * token HUD in an On Target world -- and falling back to Attack would quietly misreport it. The pill
 * asks the system for the label instead.
 *
 * A maneuver under a heading gets the heading folded back into its name, so the pill reads
 * "All-Out Attack (Strong)" the way the system's own label does. The tile can stay terse because it
 * has the heading above it; the pill stands alone.
 */
export function maneuverById(id: string | null | undefined): HudManeuver | undefined {
  if (!id) return undefined;

  for (const group of HUD_MANEUVER_GROUPS) {
    const maneuver = group.maneuvers.find((m) => m.id === id);
    if (!maneuver) continue;

    return group.heading ? { ...maneuver, name: `${group.heading} (${maneuver.name})` } : maneuver;
  }
  return undefined;
}
