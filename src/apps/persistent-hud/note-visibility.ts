/**
 * Whether an attack's notes are open under its name. The default is the reader's setting; a
 * right-click flips one attack away from it. Both are the reader's own rather than the actor's --
 * a GM who wants the goblin's flavour text out of the way has not decided that for the player.
 *
 * Only departures from the default are kept, so a toggle flipped back leaves nothing behind, and
 * keyed by actor because the same `system.melee.00000` names a different attack on every sheet.
 */

/** As read back from a client setting, so anything the console may have put there is tolerated. */
export type NoteOverrides = Record<string, Record<string, unknown> | undefined>;

export interface NoteVisibility {
  shownByDefault: boolean;
  overrides: NoteOverrides;
}

export function notesShown(visibility: NoteVisibility, actorId: string, key: string): boolean {
  const override = visibility.overrides[actorId]?.[key];
  return typeof override === "boolean" ? override : visibility.shownByDefault;
}

export function withNotesShown(
  visibility: NoteVisibility,
  actorId: string,
  key: string,
  shown: boolean,
): NoteOverrides {
  const { [key]: _previous, ...others } = visibility.overrides[actorId] ?? {};
  const actor = shown === visibility.shownByDefault ? others : { ...others, [key]: shown };

  const { [actorId]: _actor, ...rest } = visibility.overrides;
  return Object.keys(actor).length > 0 ? { ...rest, [actorId]: actor } : rest;
}
