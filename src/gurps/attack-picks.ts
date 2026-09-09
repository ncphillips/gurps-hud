/**
 * Which of an actor's attacks the strip shows, and in what order.
 *
 * A GURPS character sheet lists every attack the character could conceivably make -- every usage
 * mode of every weapon, every innate attack, every unarmed option -- which is far more than belongs
 * in a strip that has to stay one glance wide. So the HUD shows nothing until somebody says what to
 * show: attacks are dragged onto it off the character sheet, or added wholesale, and the choice is
 * remembered on the actor.
 *
 * A pick is the Game Aid's own key path for the attack -- `system.melee.00000`, or
 * `system.melee.00000.contains.00001` for one nested under another. That is exactly the string the
 * sheet puts in the drag payload and exactly what `hud-view` keys its rows by, so the same string
 * identifies an attack all the way from the sheet to the flag to the rendered row.
 *
 * Everything here is pure and knows nothing about actors or Foundry: `game-aid.ts` reads and writes
 * the flag, and this decides what should be in it.
 */

export type AttackKind = "melee" | "ranged";

/** The picked attacks, split by group -- they are ordered, and only ever within their own group. */
export interface AttackPicks {
  melee: string[];
  ranged: string[];
}

export function noPicks(): AttackPicks {
  return { melee: [], ranged: [] };
}

const PREFIX: Record<AttackKind, string> = {
  melee: "system.melee.",
  ranged: "system.ranged.",
};

/**
 * Which group a key belongs to, or `null` for anything that is not an attack. The key names its own
 * group, so nothing that carries one has to be told which list it came out of.
 */
export function attackKind(key: string): AttackKind | null {
  if (key.startsWith(PREFIX.melee)) return "melee";
  if (key.startsWith(PREFIX.ranged)) return "ranged";
  return null;
}

export interface DroppedAttack {
  /** The sheet it was dragged off, so a drop can refuse one character's attack on another's strip. */
  actorId: string | null;
  kind: AttackKind;
  key: string;
}

/**
 * Reads a `text/plain` drag payload as an attack, or `null` for every other thing that can be
 * dropped on the strip. The shape is the Game Aid's: `GurpsActorSheet#makelistdrag` puts the actor
 * id and the list key on every row a sheet can drag, and the HUD's own drags copy it (see
 * `dragPayload`) so a row leaving one part of the strip looks the same as one arriving from a sheet.
 */
export function droppedAttack(payload: string | undefined | null): DroppedAttack | null {
  if (!payload) return null;

  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    // Foundry drags plain uuids around too; anything unparseable is simply not an attack.
    return null;
  }

  if (!data || typeof data !== "object") return null;

  const { actorid, key } = data as { actorid?: unknown; key?: unknown };
  if (typeof key !== "string") return null;

  const kind = attackKind(key);
  if (!kind) return null;

  return { actorId: typeof actorid === "string" ? actorid : null, kind, key };
}

/**
 * Whether a dropped attack is one this actor can actually make.
 *
 * This is the whole of "Bob's attacks cannot end up on Greg's strip". Every row a GURPS sheet hands
 * out is stamped with the id of the sheet it came from, so the check is a comparison rather than a
 * guess -- and it is strict in both directions: a payload naming no actor at all is refused too,
 * because a key alone says which *slot* an attack sits in and nothing about whose sheet it is a
 * slot on, and `system.melee.00000` names a different weapon on every character in the world.
 */
export function isFromActor(dropped: DroppedAttack, actorId: string | null | undefined): boolean {
  return !!actorId && dropped.actorId === actorId;
}

/**
 * What the HUD puts on the wire when a row is dragged, so `droppedAttack` can read it back. The
 * `type` is the HUD's own rather than the sheet's `melee`/`ranged`, so that an attack dragged over
 * the macro footer -- which offers itself to Foundry as the stock hotbar -- is not mistaken for a
 * document somebody wants a macro made out of.
 */
export const ATTACK_DRAG_TYPE = "gurps-hud.attack";

export function dragPayload(actorId: string | null | undefined, key: string): string {
  return JSON.stringify({ actorid: actorId ?? null, type: ATTACK_DRAG_TYPE, key });
}

/**
 * Puts an attack in its group, ahead of `before` or at the end. This is the whole of both gestures:
 * an attack arriving from the sheet and one already picked being dragged somewhere else in the list
 * differ only in whether the key was already there, and removing it first covers both.
 *
 * A drop that would cross groups -- a bow onto the melee rows -- changes nothing, because "before"
 * has no meaning in a list the attack cannot join.
 */
export function placePick(picks: AttackPicks, key: string, before: string | null): AttackPicks {
  const kind = attackKind(key);
  if (!kind) return picks;
  if (before !== null && attackKind(before) !== kind) return picks;

  const group = picks[kind].filter((each) => each !== key);
  const at = before === null ? -1 : group.indexOf(before);
  if (at === -1) group.push(key);
  else group.splice(at, 0, key);

  return { ...picks, [kind]: group };
}

export function removePick(picks: AttackPicks, key: string): AttackPicks {
  const kind = attackKind(key);
  if (!kind) return picks;

  return { ...picks, [kind]: picks[kind].filter((each) => each !== key) };
}

/** One place up or down within the group, which is the keyboard's half of a drag to reorder. */
export function nudgePick(picks: AttackPicks, key: string, step: number): AttackPicks {
  const kind = attackKind(key);
  if (!kind) return picks;

  const group = picks[kind];
  const at = group.indexOf(key);
  const to = at + step;
  if (at === -1 || to < 0 || to >= group.length) return picks;

  const moved = [...group];
  moved.splice(at, 1);
  moved.splice(to, 0, key);

  return { ...picks, [kind]: moved };
}

/**
 * The rows for a group, in the order they were picked. A pick with no row is silently dropped: the
 * character sheet is the source of truth for what attacks exist, and re-importing one from GCS
 * renumbers its lists, so a stale key means the attack is gone rather than that anything is wrong.
 */
export function orderByPicks<T extends { key: string }>(rows: T[], picks: string[]): T[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return picks.map((key) => byKey.get(key)).filter((row): row is T => row !== undefined);
}

function keyList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((entry) => typeof entry === "string") ? value : null;
}

/**
 * Reads the flag back into picks. Defensive because this is persisted data: it outlives the version
 * of the HUD that wrote it, and an actor exported from one world and imported into another brings
 * whatever it was carrying with it.
 */
export function readPicks(value: unknown): AttackPicks {
  if (!value || typeof value !== "object") return noPicks();

  const { melee, ranged } = value as { melee?: unknown; ranged?: unknown };
  const picked = { melee: keyList(melee), ranged: keyList(ranged) };
  if (!picked.melee || !picked.ranged) return noPicks();

  return { melee: picked.melee, ranged: picked.ranged };
}
