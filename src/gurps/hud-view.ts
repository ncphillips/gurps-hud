import { t } from "@/i18n";
import { noPicks, orderByPicks } from "./attack-picks";
import type { AttackPicks } from "./attack-picks";
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
  /** `null` when there is no actor to have taken a wound. */
  shock: number | null;
  condition: ConditionVital;
  dodge: string;
  move: string;
  attrs: { basic: AttrColumn; secondary: AttrColumn };
  /** Only the attacks that were picked, in the order they were picked -- see `attack-picks.ts`. */
  melee: MeleeRow[];
  ranged: RangedRow[];
  /**
   * Whether the actor has any attack at all, picked or not. It is what tells an actor who fights
   * with nothing apart from one whose attacks simply have not been chosen yet, which are two
   * different empty tables: only the second is worth offering to fill.
   */
  hasAttacks: boolean;
  skills: SkillRow[];
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

/** GURPS thresholds: a third of maximum is reeling/exhausted territory, zero is collapsing. */
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

/**
 * In the Game Aid's own order; the ids double as its status-effect ids.
 *
 * @todo Pull directly from the Game Aid instead of duplicating here.
 */
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
 * The maneuver the actor is performing, or `null` when they are performing none -- i.e. are not in
 * combat, which the Game Aid records as the literal string "undefined" rather than an absent value.
 */
function activeManeuver(conditions: { maneuver?: string }): string | null {
  return !conditions.maneuver || conditions.maneuver === "undefined" ? null : conditions.maneuver;
}

/**
 * The postures that take a fraction of Move (B551). The rest need no arithmetic: standing leaves
 * Move alone, sitting sets it to none and lying prone to a flat yard.
 *
 * The fractions round down. B9 makes that the default -- fractions go down unless a rule explicitly
 * says otherwise, and the posture table says nothing -- and B387 settles it, because it states the
 * same postures as movement-point surcharges: crouching costs +1/2 MP per hex, so hexes are
 * Move / 1.5, which is the same 2/3; kneeling and crawling cost +2 MP, which is the same third.
 * Hexes cannot be fractional, so that half of the Basic Set floors these numbers by construction,
 * and rounding them up here would put the two halves in contradiction. Move 5 crouching is 3 yards
 * computed either way.
 */
const POSTURE_MOVE_FRACTION: Record<string, number> = {
  crouch: 2 / 3,
  kneel: 1 / 3,
  crawl: 1 / 3,
};

/**
 * The Move a posture's fraction applies to, in the order GURPS builds it: encumbrance takes its
 * share of Basic Move first, dropping the fraction (B17), and reeling and exhaustion then halve
 * what is left, each rounding *up* -- the explicit exceptions B380 and B426 make to B9's round-down
 * default.
 */
function encumberedMove(system: GurpsSystem): number {
  const conditions = system.conditions ?? {};
  let move = Math.max(1, Math.floor(basicMove(system) * encumbranceFactor(system)));

  if (conditions.reeling) move = Math.ceil(move / 2);
  if (conditions.exhausted) move = Math.ceil(move / 2);
  return move;
}

/**
 * The same Move as the Game Aid arrives at it: halving for the conditions first and applying the
 * encumbrance factor afterwards, unrounded. The two orders agree for every Basic Move a character
 * is likely to have and part company on a fast, wounded, encumbered monster, so this one is kept
 * deliberately faithful to `_calculateEncumbranceIssues` -- it exists only to recognize the number
 * the system wrote, never to be displayed.
 */
function gameAidMove(system: GurpsSystem): number {
  const conditions = system.conditions ?? {};
  let move = basicMove(system);

  if (conditions.reeling) move = Math.ceil(move / 2);
  if (conditions.exhausted) move = Math.ceil(move / 2);
  return move * encumbranceFactor(system);
}

/** Unencumbered Move, which the Game Aid keeps on encumbrance level 0 rather than reading back. */
function basicMove(system: GurpsSystem): number {
  const levels = Object.values(system.encumbrance ?? {}).filter(Boolean);
  return num(levels.find((entry) => num(entry.level) === 0)?.move) || num(system.basicmove?.value);
}

/** Each encumbrance level takes another fifth off Move. */
function encumbranceFactor(system: GurpsSystem): number {
  const levels = Object.values(system.encumbrance ?? {}).filter(Boolean);
  return (10 - 2 * num(levels.find((entry) => entry.current)?.level)) / 10;
}

/**
 * Move as the strip shows it, with a posture's fraction rounded down (see `POSTURE_MOVE_FRACTION`)
 * and never below a yard -- B387's "you can always move at least one hex," which is a floor on
 * movement itself rather than anything to do with rounding.
 *
 * The Game Aid rounds a posture's fraction *up* -- `Math.ceil` in its actor's `_adjustMove` -- so a
 * crouching Move 5 character is written into `system.currentmove` as 4 where GURPS makes it 3. Its
 * own token-action bar floors the same fractions, so the number is corrected here rather than
 * followed.
 *
 * Only the number the system actually produced that way is touched. A world that leaves Move alone
 * outside combat reports full Move, and a maneuver that holds Move lower than the posture does wins
 * over it; both are passed through as the system has them, because neither is this rounding. So is
 * anything the system arrived at by arithmetic this does not recognize: the strip would rather show
 * the system's number than a number neither of them can account for.
 */
export function currentMove(system: GurpsSystem): string {
  const conditions = system.conditions ?? {};
  const reported = str(system.currentmove);
  if (!reported) return EM_DASH;

  const fraction = POSTURE_MOVE_FRACTION[conditions.posture ?? ""];
  if (fraction === undefined) return reported;

  const base = gameAidMove(system);
  const full = Math.max(1, Math.floor(base));
  const roundedUp = Math.max(1, Math.ceil(fraction * base));
  if (num(system.currentmove) !== roundedUp) return reported;

  // A fraction that rounds up to exactly full Move cannot be told apart from Move never having been
  // adjusted at all. The Game Aid only adjusts it in combat, so out of combat that number is taken
  // at face value and the strip keeps agreeing with the character sheet.
  if (roundedUp >= full && !activeManeuver(conditions)) return reported;

  return String(Math.max(1, Math.floor(fraction * encumberedMove(system))));
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
      label: t("condition.reelingAndExhausted.label"),
      tone: "danger",
      title: t("condition.reelingAndExhausted.title"),
    };
  if (reeling)
    return {
      label: t("condition.reeling.label"),
      tone: "danger",
      title: t("condition.reeling.title"),
    };
  if (exhausted)
    return {
      label: t("condition.exhausted.label"),
      tone: "warn",
      title: t("condition.exhausted.title"),
    };
  return { label: EM_DASH, tone: "ok", title: t("condition.none.title") };
}

/**
 * Flattens one of the Game Aid's keyed lists, following `contains` children depth-first, pairing
 * each entry with its full key path -- `system.melee.00000.contains.00001`.
 *
 * The path is built the way `GurpsActorSheet`'s own `flatlist` helper builds it, because it is the
 * string the sheet then hands out in a row's drag payload. Keeping the two spellings identical is
 * what lets an attack dragged off the sheet name a row the HUD already knows how to render.
 */
export function flattenKeyed<T extends object>(
  list: GurpsList<T> | undefined,
  prefix: string,
): Array<[string, T]> {
  const flat: Array<[string, T]> = [];
  for (const [key, entry] of Object.entries(list ?? {})) {
    if (!entry) continue;
    const path = `${prefix}${key}`;
    flat.push([path, entry]);
    flat.push(...flattenKeyed(entry.contains as GurpsList<T> | undefined, `${path}.contains.`));
  }
  return flat;
}

/** Flattens one of the Game Aid's keyed lists, following `contains` children depth-first. */
export function flattenList<T extends object>(list: GurpsList<T> | undefined): T[] {
  return flattenKeyed(list, "").map(([, entry]) => entry);
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
  return flattenKeyed<GurpsMelee>(system?.melee, "system.melee.").map(([key, melee]) => ({
    key,
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
  return flattenKeyed<GurpsRanged>(system?.ranged, "system.ranged.").map(([key, ranged]) => ({
    key,
    name: attackName(ranged),
    acc: str(ranged.acc) || EM_DASH,
    range: str(ranged.range) || EM_DASH,
    rof: str(ranged.rof) || EM_DASH,
    level: levelCell(ranged, "R"),
    damage: damageCell(ranged),
    equipped: isEquipped(ranged.name, carried),
  }));
}

/** Every attack on the sheet, in the sheet's own order -- what "add them all" picks. */
export function allAttackPicks(system: GurpsSystem): AttackPicks {
  return {
    melee: meleeRows(system).map((row) => row.key),
    ranged: rangedRows(system).map((row) => row.key),
  };
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

/** What the strip shows about the token the user is targeting: whose body, and its parts. */
export interface TargetView {
  name: string;
  hitLocations: HitLocationRow[];
}

/**
 * The hit location table belongs to the target, not the attacker: aiming is a choice about the
 * other body. `null` with nothing targeted, so the pill can say so rather than show a stale table.
 */
export function buildTargetView(actor: GurpsActorLike | null): TargetView | null {
  if (!actor) return null;
  return { name: actor.name, hitLocations: hitLocationRows(actor.system) };
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
      header: t("attributes.basicHeader"),
      groups: [
        [
          { label: t("attributes.st"), value: str(attributes.ST?.value), otf: "ST" },
          { label: t("attributes.dx"), value: str(attributes.DX?.value), otf: "DX" },
          { label: t("attributes.iq"), value: str(attributes.IQ?.value), otf: "IQ" },
          { label: t("attributes.ht"), value: str(attributes.HT?.value), otf: "HT" },
        ],
        [
          { label: t("attributes.thrust"), value: str(system.thrust), otf: null },
          { label: t("attributes.swing"), value: str(system.swing), otf: null },
          { label: t("attributes.basicSpeed"), value: str(system.basicspeed?.value), otf: null },
          { label: t("attributes.basicMove"), value: str(system.basicmove?.value), otf: null },
        ],
      ],
    },
    secondary: {
      header: t("attributes.secondaryHeader"),
      groups: [
        [
          { label: t("attributes.will"), value: str(attributes.WILL?.value), otf: "Will" },
          {
            label: t("attributes.frightCheck"),
            value: str(system.frightcheck),
            otf: "Fright Check",
          },
        ],
        [
          { label: t("attributes.perception"), value: str(attributes.PER?.value), otf: "Per" },
          { label: t("attributes.vision"), value: str(system.vision), otf: "Vision" },
          { label: t("attributes.hearing"), value: str(system.hearing), otf: "Hearing" },
          { label: t("attributes.tasteSmell"), value: str(system.tastesmell), otf: "Taste Smell" },
          { label: t("attributes.touch"), value: str(system.touch), otf: "Touch" },
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

/**
 * What the strip shows with nothing selected. The chrome stays put -- the GM can still reach the
 * macro bar, and the name reads as an invitation to pick somebody -- while every readout the actor
 * would have filled in is blank, so an empty strip can never be mistaken for a character with no
 * hit points. Nothing here is looked up from the Game Aid: there is no actor to ask about.
 */
export function emptyHudView(): HudView {
  const blankPool: PoolVital = { value: EM_DASH, max: EM_DASH, tone: "ok" };

  return {
    name: t("portrait.noActor"),
    img: null,
    posture: { id: "standing", label: EM_DASH, tone: "ok" },
    postures: [],
    hp: blankPool,
    fp: { ...blankPool },
    shock: null,
    condition: { label: EM_DASH, tone: "ok", title: "" },
    dodge: EM_DASH,
    move: EM_DASH,
    attrs: attrColumns({} as GurpsSystem),
    melee: [],
    ranged: [],
    hasAttacks: false,
    skills: [],
    maneuverId: null,
  };
}

export function buildHudView(
  actor: GurpsActorLike,
  localize: Localize,
  picks: AttackPicks = noPicks(),
): HudView {
  const system = actor.system ?? ({} as GurpsSystem);
  const conditions = system.conditions ?? {};
  const melee = meleeRows(system);
  const ranged = rangedRows(system);

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
    move: currentMove(system),
    attrs: attrColumns(system),
    melee: orderByPicks(melee, picks.melee),
    ranged: orderByPicks(ranged, picks.ranged),
    hasAttacks: melee.length > 0 || ranged.length > 0,
    skills: skillRows(system),
    maneuverId: activeManeuver(conditions),
  };
}
