import { t } from "@/i18n";

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
 *
 * Only the ids are held here; names, hints and headings are looked up per call, because the module
 * is imported before Foundry has settled on a language.
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

const GROUPS = [
  {
    heading: null,
    ids: [
      "attack",
      "move_and_attack",
      "move",
      "change_posture",
      "aim",
      "evaluate",
      "feint",
      "ready",
      "concentrate",
      "wait",
    ],
  },
  {
    heading: "allOutAttack",
    ids: ["aoa_determined", "aoa_double", "aoa_strong", "aoa_feint", "aoa_ranged", "aoa_suppress"],
  },
  {
    heading: "allOutDefence",
    ids: ["aod_dodge", "aod_parry", "aod_block", "aod_double"],
  },
] as const;

type ManeuverId = (typeof GROUPS)[number]["ids"][number];

function maneuver(id: ManeuverId): HudManeuver {
  return { id, name: t(`maneuvers.${id}.name`), hint: t(`maneuvers.${id}.hint`) };
}

export function maneuverGroups(): readonly HudManeuverGroup[] {
  return GROUPS.map((group) => ({
    heading: group.heading ? t(`maneuvers.groups.${group.heading}`) : null,
    maneuvers: group.ids.map(maneuver),
  }));
}

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

  for (const group of GROUPS) {
    if (!(group.ids as readonly string[]).includes(id)) continue;

    const found = maneuver(id as ManeuverId);
    if (!group.heading) return found;

    const heading = t(`maneuvers.groups.${group.heading}`);
    return { ...found, name: t("maneuvers.qualified", { heading, name: found.name }) };
  }
  return undefined;
}
