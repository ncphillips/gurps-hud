import { allAttackPicks, buildHudView, buildTargetView } from "@/gurps/hud-view";
import type { HudView, TargetView } from "@/gurps/hud-view";
import type { AttackPicks } from "@/gurps/attack-picks";
import type { GurpsActorLike } from "@/gurps/system-types";

/*
 * A view model for the components that take a whole `HudView`. It is built by `buildHudView` from an
 * actor rather than written out as a literal, so a fixture can never drift into a shape the real
 * Game Aid would never produce. Every row the strip renders differently appears once: an equipped
 * attack and an unequipped one, a cell with nothing to roll (Punch has no block), a skill and an
 * attribute.
 */

const localize = (key: string) => key.split(".").pop() ?? key;

function keyed<T>(entries: T[]): Record<string, T> {
  return Object.fromEntries(entries.map((entry, index) => [String(index).padStart(5, "0"), entry]));
}

/** Brent Mitton, the character the design mock is drawn from. */
export function fixtureActor(): GurpsActorLike {
  return {
    id: "actor-brent",
    name: "Brent Mitton",
    img: null,
    statuses: [],
    system: {
      attributes: {
        ST: { value: 9 },
        DX: { value: 10 },
        IQ: { value: 12 },
        HT: { value: 11 },
        WILL: { value: 12 },
        PER: { value: 12 },
        QN: { value: 10 },
      },
      HP: { value: 20, max: 22 },
      FP: { value: 11, max: 11 },
      thrust: "1d−2",
      swing: "1d−1",
      basicspeed: { value: "5.25" },
      basicmove: { value: "5" },
      frightcheck: 12,
      vision: 12,
      hearing: 12,
      tastesmell: 12,
      touch: 12,
      currentmove: 5,
      currentdodge: 8,
      conditions: { posture: "standing", maneuver: "attack", reeling: false, exhausted: false },
      encumbrance: keyed([{ key: "enc0", level: 0, current: true }]),
      equipment: { carried: keyed([{ name: "Spear", equipped: true }]), other: {} },
      melee: keyed([
        {
          name: "Spear",
          mode: "Thrust",
          level: 5,
          damage: "1d+1 imp",
          reach: "1–2",
          parry: "5",
          block: "",
        },
        { name: "Punch", level: 10, damage: "1d−3 cr", reach: "C", parry: "8", block: "" },
      ]),
      ranged: keyed([
        {
          name: "Spear",
          mode: "Thrown",
          level: 6,
          damage: "1d+1 imp",
          acc: "2",
          range: "9/13",
          rof: "1",
        },
      ]),
      skills: keyed([
        { name: "Spear", level: 5 },
        { name: "Survival (Woodlands)", level: 11 },
      ]),
      hitlocations: keyed([
        { where: "Skull", penalty: "-7", dr: "2", roll: "3-4" },
        { where: "Torso", penalty: "0", dr: "1", roll: "9-10" },
        { where: "Vitals", penalty: "-3", dr: "1", roll: "-" },
      ]),
    },
  };
}

/**
 * @param picks Which attacks the strip has been told to show. Defaults to all of them, because the
 *   design mock is drawn with Brent's weapon tables full; pass `noPicks()` for the state a
 *   character starts in, before anybody has dragged anything onto the strip.
 */
export function fixtureView(picks?: AttackPicks): HudView {
  const actor = fixtureActor();
  return buildHudView(actor, localize, picks ?? allAttackPicks(actor.system));
}

/** Something for Brent to aim at, with a body plan of its own. */
export function fixtureTargetView(): TargetView {
  const goblin = fixtureActor();
  goblin.name = "Goblin Grunt";
  return buildTargetView(goblin)!;
}
