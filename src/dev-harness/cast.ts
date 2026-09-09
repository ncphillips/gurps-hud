/**
 * The harness's cast. Every one of them is on the canvas and fully sheeted, all the time -- the
 * query parameters only hand out the roles (who is selected, who is targeted), so switching
 * characters in the strip works without reloading and no fixture is half an actor.
 *
 * The sheets are typed as the real `GurpsSystem`, so a stub that drifts from the shape the HUD
 * reads fails `npm run check` rather than rendering blank.
 */
import type {
  GurpsActorLike,
  GurpsHitLocation,
  GurpsList,
  GurpsSkill,
  GurpsSystem,
} from "@/gurps/system-types";
import { fire } from "./hooks";

/** A keyed list, as the Game Aid stores every collection: `{ "00000": entry, ... }`. */
function keyed<T>(entries: T[]): GurpsList<T> {
  return Object.fromEntries(
    entries.map((entry, index) => [String(index).padStart(5, "0"), entry]),
  ) as GurpsList<T>;
}

function hitLocations(rows: Array<[where: string, penalty: string, dr: string, roll: string]>) {
  return keyed<GurpsHitLocation>(
    rows.map(([where, penalty, dr, roll]) => ({ where, penalty, dr, roll })),
  );
}

function skills(rows: Array<[name: string, level: number]>) {
  return keyed<GurpsSkill>(rows.map(([name, level]) => ({ name, level })));
}

/**
 * A blank sheet, fresh every call: the actors mutate their own -- a posture, a pool, a maneuver --
 * so sharing one between them would let the goblin stand up when Brent does.
 */
function sheet(overrides: Partial<GurpsSystem>): GurpsSystem {
  return {
    attributes: {
      ST: { value: 10 },
      DX: { value: 10 },
      IQ: { value: 10 },
      HT: { value: 10 },
      WILL: { value: 10 },
      PER: { value: 10 },
      QN: { value: 10 },
    },
    HP: { value: 10, max: 10 },
    FP: { value: 10, max: 10 },
    thrust: "1d−2",
    swing: "1d",
    basicspeed: { value: "5.00" },
    basicmove: { value: "5" },
    frightcheck: 10,
    vision: 10,
    hearing: 10,
    tastesmell: 10,
    touch: 10,
    currentmove: 5,
    currentdodge: 8,
    conditions: { posture: "standing", maneuver: "undefined", reeling: false, exhausted: false },
    encumbrance: keyed([{ key: "enc0", level: 0, current: true }]),
    equipment: { carried: {}, other: {} },
    melee: {},
    ranged: {},
    skills: {},
    hitlocations: {},
    ...overrides,
  };
}

/** The Game Aid's actor, as far as the HUD is concerned, plus the maneuver setter it looks up loosely. */
export interface HarnessActor extends GurpsActorLike {
  id: string;
  system: GurpsSystem;
  replaceManeuver(maneuver: string): Promise<void>;
}

function actor(id: string, name: string, system: GurpsSystem): HarnessActor {
  const self: HarnessActor = {
    id,
    name,
    img: null,
    statuses: [],
    system,
    sheet: { render: () => console.log(`harness: open ${name}'s character sheet`) },

    /** Mimics Document#update closely enough for the HP/FP boxes: walk the key path, then rerender. */
    async update(changes: Record<string, unknown>) {
      for (const [path, value] of Object.entries(changes)) {
        const keys = path.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let target: any = self;
        for (const key of keys.slice(0, -1)) target = target[key];
        target[keys[keys.length - 1]] = value;
      }
      fire("updateActor");
    },

    async replacePosture(posture: string) {
      self.system.conditions.posture = posture;
      fire("updateActor");
    },

    async replaceManeuver(maneuver: string) {
      self.system.conditions.maneuver = maneuver;
      fire("updateActor");
    },
  };

  return self;
}

/** Brent Mitton, the character the design mock is drawn from. */
function brent(): HarnessActor {
  return actor(
    "actor-brent",
    "Brent Mitton",
    sheet({
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
        { name: "Kick", level: 8, damage: "1d−2 cr", reach: "C,1", parry: "", block: "" },
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
      skills: skills([
        ["Spear", 5],
        ["Brawling", 10],
        ["Stealth", 9],
        ["First Aid", 12],
        ["Survival (Woodlands)", 11],
        ["Climbing", 9],
        ["Knife", 10],
        ["Area Knowledge (Home)", 13],
        ["Carousing", 11],
        ["Scrounging", 12],
        ["Swimming", 11],
        ["Throwing", 6],
      ]),
      hitlocations: hitLocations([
        ["Eye", "-9", "0", "-"],
        ["Skull", "-7", "2", "3-4"],
        ["Face", "-5", "0", "5"],
        ["Right Leg", "-2", "1", "6-7"],
        ["Right Arm", "-2", "1", "8"],
        ["Torso", "0", "1", "9-10"],
        ["Groin", "-3", "1", "11"],
        ["Left Arm", "-2", "1", "12"],
        ["Left Leg", "-2", "1", "13-14"],
        ["Hand", "-4", "0", "15"],
        ["Foot", "-4", "0", "16"],
        ["Neck", "-5", "0", "17-18"],
        ["Vitals", "-3", "1", "-"],
      ]),
    }),
  );
}

/** Something for Brent to aim at, hurt and out of breath so the vitals show their warning tones. */
function goblin(): HarnessActor {
  return actor(
    "actor-goblin",
    "Goblin Grunt",
    sheet({
      attributes: {
        ST: { value: 11 },
        DX: { value: 11 },
        IQ: { value: 9 },
        HT: { value: 11 },
        WILL: { value: 9 },
        PER: { value: 10 },
        QN: { value: 10 },
      },
      HP: { value: 4, max: 11 },
      FP: { value: 3, max: 11 },
      currentmove: 4,
      currentdodge: 7,
      conditions: { posture: "crouch", maneuver: "undefined", reeling: true, exhausted: true },
      equipment: { carried: keyed([{ name: "Short Spear", equipped: true }]), other: {} },
      melee: keyed([
        { name: "Short Spear", level: 11, damage: "1d+1 imp", reach: "1", parry: "8", block: "" },
        { name: "Bite", level: 11, damage: "1d−2 cr", reach: "C", parry: "", block: "" },
      ]),
      skills: skills([
        ["Spear", 11],
        ["Brawling", 11],
        ["Stealth", 10],
      ]),
      hitlocations: hitLocations([
        ["Eye", "-9", "0", "-"],
        ["Skull", "-7", "2", "3-4"],
        ["Face", "-5", "0", "5"],
        ["Torso", "0", "0", "9-11"],
        ["Groin", "-3", "0", "12"],
        ["Arm", "-2", "0", "13-14"],
        ["Leg", "-2", "0", "15-16"],
        ["Neck", "-5", "0", "17"],
        ["Vitals", "-3", "0", "18"],
      ]),
    }),
  );
}

/** A body plan that is nobody's humanoid, and the one token the user does not own. */
function dragon(): HarnessActor {
  return actor(
    "actor-dragon",
    "Dragon",
    sheet({
      attributes: {
        ST: { value: 30 },
        DX: { value: 12 },
        IQ: { value: 12 },
        HT: { value: 13 },
        WILL: { value: 14 },
        PER: { value: 13 },
        QN: { value: 10 },
      },
      HP: { value: 40, max: 40 },
      FP: { value: 13, max: 13 },
      thrust: "3d−1",
      swing: "5d+1",
      currentmove: 8,
      currentdodge: 9,
      melee: keyed([
        { name: "Bite", level: 14, damage: "5d+1 cut", reach: "C,1", parry: "", block: "" },
        { name: "Claw", level: 14, damage: "5d+1 cut", reach: "C,1", parry: "11", block: "" },
      ]),
      hitlocations: hitLocations([
        ["Eye", "-9", "0", "-"],
        ["Skull", "-7", "6", "3-4"],
        ["Torso", "0", "6", "9-11"],
        ["Wing", "-2", "3", "6-8"],
        ["Leg", "-2", "5", "12-14"],
        ["Tail", "-3", "4", "15-16"],
        ["Neck", "-5", "5", "17-18"],
      ]),
    }),
  );
}

export const CAST = { brent: brent(), goblin: goblin(), dragon: dragon() };

export type CastMember = keyof typeof CAST;

export function castMember(key: string | null): HarnessActor | null {
  return key && key in CAST ? CAST[key as CastMember] : null;
}

/**
 * The tokens on the harness's scene. The dragon is deliberately unowned: the character switcher
 * lists one entry per *controllable* token, and something has to prove it filters.
 */
export const TOKENS = [
  { id: "t-brent", name: CAST.brent.name, actor: CAST.brent, isOwner: true },
  { id: "t-goblin", name: CAST.goblin.name, actor: CAST.goblin, isOwner: true },
  { id: "t-dragon", name: CAST.dragon.name, actor: CAST.dragon, isOwner: false },
].map((token) => ({ ...token, document: { texture: { src: null } } }));
