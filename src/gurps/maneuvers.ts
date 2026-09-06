/**
 * The twelve maneuvers the HUD offers, in the order the design lays them out (two columns, filled
 * row-wise). The Game Aid knows more than these -- every All-Out Attack variant, the On Target
 * additions -- but the HUD trades completeness for a menu you can read in one glance.
 * @todo Include additional variants as sub-options. e.g pick "All-Out Attack" and then specify "strong"
 */

export interface HudManeuver {
  /** The Game Aid's own maneuver id, as stored in `system.conditions.maneuver`. */
  id: string;
  name: string;
  hint: string;
}

export const HUD_MANEUVERS: readonly HudManeuver[] = [
  { id: "attack", name: "Attack", hint: "1 action · Move ≤ 1 hex" },
  { id: "allout_attack", name: "All-Out Attack", hint: "+4 to hit, or 2 attacks · no defence" },
  { id: "move_and_attack", name: "Move and Attack", hint: "−4 to hit, skill 9 max" },
  { id: "allout_defense", name: "All-Out Defence", hint: "+2 to one defence, or two defences" },
  { id: "move", name: "Move", hint: "full Move, no attack" },
  { id: "change_posture", name: "Change Posture", hint: "stand, kneel, prone, sit" },
  { id: "aim", name: "Aim", hint: "+Acc on next ranged attack" },
  { id: "evaluate", name: "Evaluate", hint: "+1 per turn, max +3" },
  { id: "feint", name: "Feint", hint: "Quick Contest of skill" },
  { id: "ready", name: "Ready", hint: "draw or ready a weapon" },
  { id: "concentrate", name: "Concentrate", hint: "one mental task" },
  { id: "wait", name: "Wait", hint: "act on a trigger" },
];

/**
 * Returns nothing for a maneuver this menu doesn't list. An actor can legitimately be performing one
 * the Game Aid knows and we don't -- an All-Out Attack variant chosen from the token HUD -- and
 * falling back to Attack would quietly misreport it. The pill asks the system for the label instead.
 */
export function maneuverById(id: string | null | undefined): HudManeuver | undefined {
  return HUD_MANEUVERS.find((m) => m.id === id);
}
