import { attackOtf, skillOtf } from "./otf";
import type {
  GurpsActorLike,
  GurpsEquipment,
  GurpsHitLocation,
  GurpsList,
  GurpsMelee,
  GurpsRanged,
  GurpsSkill,
  GurpsSystem,
  Numeric,
} from "./system-types";

/**
 * Turns a GURPS Game Aid actor into the flat, presentational shape the HUD renders. Everything here
 * is pure: the Svelte tree stays dumb, and the awkward parts of the system's data model -- numbers
 * stored as strings, keyed lists with `contains` children, postures spread across active effects --
 * are dealt with once, here, where they can be tested.
 */

export type Tone = "ok" | "warn" | "danger";

export type Localize = (key: string) => string;

export interface RollableCell {
  text: string;
  /** `null` when there is nothing to roll -- the cell renders as a dim em dash. */
  otf: string | null;
}

export interface MeleeRow {
  key: string;
  name: string;
  reach: string;
  level: RollableCell;
  damage: RollableCell;
  block: RollableCell;
  parry: RollableCell;
  equipped: boolean;
}

export interface RangedRow {
  key: string;
  name: string;
  acc: string;
  range: string;
  rof: string;
  level: RollableCell;
  damage: RollableCell;
  equipped: boolean;
}

export interface SkillRow {
  key: string;
  name: string;
  level: RollableCell;
}

export interface HitLocationRow {
  key: string;
  where: string;
  /** To-hit penalty; 0 for the torso. */
  penalty: number;
  dr: string;
  roll: string;
}

export interface AttrRow {
  label: string;
  value: string;
  otf: string | null;
}

export interface AttrColumn {
  header: string;
  /** Groups are rendered with a hairline divider between them. */
  groups: AttrRow[][];
}

export interface PoolVital {
  value: string;
  max: string;
  tone: Tone;
}

export interface ConditionVital {
  label: string;
  tone: Tone;
  title: string;
}

export interface HudView {
  name: string;
  img: string | null;
  posture: PostureOption;
  postures: PostureOption[];
  hp: PoolVital;
  fp: PoolVital;
  shock: number;
  condition: ConditionVital;
  dodge: string;
  move: string;
  attrs: { basic: AttrColumn; secondary: AttrColumn };
  melee: MeleeRow[];
  ranged: RangedRow[];
  skills: SkillRow[];
  hitLocations: HitLocationRow[];
  /** The Game Aid's maneuver id, or `null` when the actor has none -- i.e. is not in combat. */
  maneuverId: string | null;
}

const EM_DASH = "—";

function str(value: Numeric | undefined | null): string {
  return value === undefined || value === null ? "" : String(value);
}

function num(value: Numeric | undefined | null): number {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** GURPS thresholds: a third of maximum is reeling/exhausted territory, zero is collapse. */
export function poolTone(value: number, max: number): Tone {
  if (value <= 0) return "danger";
  if (max > 0 && value <= max / 3) return "warn";
  return "ok";
}

export interface PostureOption {
  /** The Game Aid's status id, which is also what `replacePosture` takes. */
  id: string;
  label: string;
  tone: Tone;
}

/** In the Game Aid's own order; the ids double as its status-effect ids. */
const POSTURES: Array<{ id: string; key: string; tone: Tone }> = [
  { id: "standing", key: "GURPS.status.Standing", tone: "ok" },
  { id: "crouch", key: "GURPS.status.Crouch", tone: "warn" },
  { id: "kneel", key: "GURPS.status.Kneel", tone: "warn" },
  { id: "sit", key: "GURPS.status.Sit", tone: "warn" },
  { id: "crawl", key: "GURPS.status.Crawling", tone: "danger" },
  { id: "prone", key: "GURPS.status.Prone", tone: "danger" },
];

export function postureOptions(localize: Localize): PostureOption[] {
  return POSTURES.map(({ id, key, tone }) => ({ id, label: localize(key), tone }));
}

export function postureBadge(posture: string | undefined, localize: Localize): PostureOption {
  const entry = POSTURES.find((candidate) => candidate.id === posture) ?? POSTURES[0];
  return { id: entry.id, label: localize(entry.key), tone: entry.tone };
}

/**
 * Shock lives on the actor as a `shock1`..`shock4` status rather than a field. Only one should ever
 * be applied, but take the worst if the actor somehow carries several.
 */
export function shockPenalty(statuses: Iterable<string> | undefined): number {
  let worst = 0;
  for (const status of statuses ?? []) {
    const match = /^shock([1-4])$/.exec(status);
    if (match) worst = Math.min(worst, -Number(match[1]));
  }
  return worst;
}

/**
 * The design's fourth vitals cell. GURPS has no per-roll "wound penalty", so this shows the two
 * states the Game Aid does track: reeling (HP at or below a third) and exhausted (FP likewise),
 * both of which halve Move and Dodge.
 */
export function conditionVital(conditions: {
  reeling?: boolean;
  exhausted?: boolean;
}): ConditionVital {
  const reeling = !!conditions.reeling;
  const exhausted = !!conditions.exhausted;

  if (reeling && exhausted)
    return {
      label: "RLNG+TIRED",
      tone: "danger",
      title: "Reeling and Exhausted: Move and Dodge are halved",
    };
  if (reeling)
    return {
      label: "REELING",
      tone: "danger",
      title: "Reeling: HP at or below 1/3, Move and Dodge halved",
    };
  if (exhausted)
    return {
      label: "TIRED",
      tone: "warn",
      title: "Exhausted: FP at or below 1/3, Move and Dodge halved",
    };
  return { label: EM_DASH, tone: "ok", title: "Not reeling or exhausted" };
}

/** Flattens one of the Game Aid's keyed lists, following `contains` children depth-first. */
export function flattenList<T extends object>(list: GurpsList<T> | undefined): T[] {
  const flat: T[] = [];
  for (const entry of Object.values(list ?? {})) {
    if (!entry) continue;
    flat.push(entry);
    flat.push(...flattenList(entry.contains as GurpsList<T> | undefined));
  }
  return flat;
}

/**
 * The Game Aid links attacks to gear by name -- an attack called "Spear, Balanced" is powered by the
 * equipment called "Spear" -- so a prefix match is what makes a weapon count as readied.
 */
export function isEquipped(
  attackName: string | undefined,
  carried: GurpsList<GurpsEquipment> | undefined,
): boolean {
  const name = str(attackName).toLowerCase();
  if (!name) return false;

  return flattenList(carried).some(
    (item) => !!item.equipped && !!item.name && name.startsWith(item.name.toLowerCase()),
  );
}

function attackName(attack: { name?: string; mode?: string }): string {
  const name = str(attack.name);
  return attack.mode ? `${name} · ${attack.mode}` : name;
}

function levelCell(attack: GurpsMelee | GurpsRanged, prefix: "M" | "R"): RollableCell {
  const level = str(attack.level ?? attack.import);
  if (!level) return { text: EM_DASH, otf: null };
  return { text: level, otf: attackOtf(prefix, attack) };
}

function damageCell(attack: GurpsMelee | GurpsRanged): RollableCell {
  const damage = str(attack.damage).trim();
  if (!damage) return { text: EM_DASH, otf: null };
  return { text: damage, otf: attackOtf("D", attack) };
}

/** Parry and block are text -- "5", "9F", "No", "" -- and only a numeric one is a defence you can roll. */
function defenceCell(
  value: string | undefined,
  prefix: "P" | "B",
  attack: GurpsMelee,
): RollableCell {
  const text = str(value).trim();
  if (!/^\d/.test(text)) return { text: EM_DASH, otf: null };
  return { text, otf: attackOtf(prefix, attack) };
}

export function meleeRows(system: GurpsSystem): MeleeRow[] {
  const carried = system?.equipment?.carried;
  return flattenList(system?.melee).map((melee, index) => ({
    key: `melee-${index}`,
    name: attackName(melee),
    reach: str(melee.reach) || EM_DASH,
    level: levelCell(melee, "M"),
    damage: damageCell(melee),
    block: defenceCell(melee.block, "B", melee),
    parry: defenceCell(melee.parry, "P", melee),
    equipped: isEquipped(melee.name, carried),
  }));
}

export function rangedRows(system: GurpsSystem): RangedRow[] {
  const carried = system?.equipment?.carried;
  return flattenList(system?.ranged).map((ranged, index) => ({
    key: `ranged-${index}`,
    name: attackName(ranged),
    acc: str(ranged.acc) || EM_DASH,
    range: str(ranged.range) || EM_DASH,
    rof: str(ranged.rof) || EM_DASH,
    level: levelCell(ranged, "R"),
    damage: damageCell(ranged),
    equipped: isEquipped(ranged.name, carried),
  }));
}

/** Container entries -- a GCS folder of skills has a name but no level -- stay as unrollable rows. */
export function skillRows(system: GurpsSystem): SkillRow[] {
  return flattenList<GurpsSkill>(system?.skills)
    .filter((skill) => str(skill.name).trim() !== "")
    .map((skill, index) => {
      const name = str(skill.name);
      const level = str(skill.level).trim();
      return {
        key: `skill-${index}`,
        name,
        level: level ? { text: level, otf: skillOtf(name) } : { text: EM_DASH, otf: null },
      };
    });
}

/** The actor's own hit location table, so a non-humanoid body plan lists its own parts. */
export function hitLocationRows(system: GurpsSystem): HitLocationRow[] {
  return flattenList<GurpsHitLocation>(system?.hitlocations)
    .filter((location) => str(location.where).trim() !== "")
    .map((location, index) => ({
      key: `loc-${index}`,
      where: str(location.where),
      penalty: num(location.penalty),
      dr: str(location.dr),
      roll: str(location.roll),
    }));
}

export function attrColumns(system: GurpsSystem): { basic: AttrColumn; secondary: AttrColumn } {
  const attributes = system?.attributes ?? ({} as GurpsSystem["attributes"]);

  return {
    basic: {
      header: "BASIC ATTRIBUTES",
      groups: [
        [
          { label: "Strength (ST)", value: str(attributes.ST?.value), otf: "ST" },
          { label: "Dexterity (DX)", value: str(attributes.DX?.value), otf: "DX" },
          { label: "Intelligence (IQ)", value: str(attributes.IQ?.value), otf: "IQ" },
          { label: "Health (HT)", value: str(attributes.HT?.value), otf: "HT" },
        ],
        [
          { label: "Basic Thrust", value: str(system.thrust), otf: null },
          { label: "Basic Swing", value: str(system.swing), otf: null },
          { label: "Basic Speed", value: str(system.basicspeed?.value), otf: null },
          { label: "Basic Move", value: str(system.basicmove?.value), otf: null },
        ],
      ],
    },
    secondary: {
      header: "SECONDARY",
      groups: [
        [
          { label: "Will", value: str(attributes.WILL?.value), otf: "Will" },
          { label: "Fright Check", value: str(system.frightcheck), otf: "Fright Check" },
        ],
        [
          { label: "Perception (Per)", value: str(attributes.PER?.value), otf: "Per" },
          { label: "Vision", value: str(system.vision), otf: "Vision" },
          { label: "Hearing", value: str(system.hearing), otf: "Hearing" },
          { label: "Taste/Smell", value: str(system.tastesmell), otf: "Taste Smell" },
          { label: "Touch", value: str(system.touch), otf: "Touch" },
        ],
      ],
    },
  };
}

function poolVital(pool: { value: Numeric; max: Numeric } | undefined): PoolVital {
  const value = num(pool?.value);
  const max = num(pool?.max);
  return { value: String(value), max: String(max), tone: poolTone(value, max) };
}

export function buildHudView(actor: GurpsActorLike, localize: Localize): HudView {
  const system = actor.system ?? ({} as GurpsSystem);
  const conditions = system.conditions ?? {};

  return {
    name: actor.name,
    img: actor.img ?? null,
    posture: postureBadge(conditions.posture, localize),
    postures: postureOptions(localize),
    hp: poolVital(system.HP),
    fp: poolVital(system.FP),
    shock: shockPenalty(actor.statuses),
    condition: conditionVital(conditions),
    dodge: str(system.currentdodge) || EM_DASH,
    move: str(system.currentmove) || EM_DASH,
    attrs: attrColumns(system),
    melee: meleeRows(system),
    ranged: rangedRows(system),
    skills: skillRows(system),
    hitLocations: hitLocationRows(system),
    // Outside combat the Game Aid leaves this as the literal string "undefined".
    maneuverId:
      !conditions.maneuver || conditions.maneuver === "undefined" ? null : conditions.maneuver,
  };
}
