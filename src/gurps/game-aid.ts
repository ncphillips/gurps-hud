import type { GurpsActorLike } from "./system-types";
import type { TokenLike } from "./actor-choices";
import { warn } from "@/log";

/**
 * The GURPS 4e Game Aid publishes its API on a `GURPS` global rather than through the module API,
 * so this file is the one place that touches it. Everything is defensive: the HUD should degrade to
 * a read-only readout if the system changes shape, not throw inside a Svelte render.
 */

interface GameAidGlobal {
  LastActor: GurpsActorLike | null;
  /** Makes an actor current and fires `updateLastActorGURPS`, as selecting its token would. */
  SetLastActor?(actor: GurpsActorLike, tokenDocument?: unknown): void;
  executeOTF(otf: string, priv?: boolean, event?: Event | null, actor?: unknown): Promise<boolean>;
  Maneuvers?: {
    /** Resolves any maneuver id the system knows, falling back to Do Nothing. */
    getManeuver(id?: string): { label?: string; name?: string } | undefined;
  };
  ModifierBucket?: {
    addModifier(mod: number | string, reason: string): void;
  };
}

declare global {
  var GURPS: GameAidGlobal | undefined;
}

export function gameAid(): GameAidGlobal | undefined {
  return globalThis.GURPS;
}

/**
 * Foundry's own localization, for keys that belong to the *system* -- posture labels, the label of a
 * maneuver outside the HUD's menu. Those strings ship with the Game Aid and follow whichever
 * languages it has, so they are looked up rather than duplicated. The HUD's own text goes through
 * `t` from `@/i18n` instead.
 */
export function localize(key: string): string {
  return game.i18n?.localize(key) ?? key;
}

/** The actor the Game Aid considers "current" -- it follows token selection and sheet focus. */
export function currentActor(): GurpsActorLike | null {
  const lastActor = gameAid()?.LastActor;
  if (lastActor) return lastActor;

  const controlled = canvas?.tokens?.controlled?.[0]?.actor;
  return (controlled as GurpsActorLike | undefined) ?? null;
}

/**
 * Points the Game Aid at an actor without selecting its token, so the bucket and chat commands agree
 * with the strip about who is acting. Falls back to nothing when the Game Aid is missing: the strip
 * still switches, it just does so alone.
 */
export function setCurrentActor(actor: GurpsActorLike, tokenId: string | null): void {
  const tokenDocument = tokenId ? canvas?.tokens?.get(tokenId)?.document : undefined;
  gameAid()?.SetLastActor?.(actor, tokenDocument);
}

/** Every token on the current scene, in the shape the actor switcher reads. */
export function canvasTokens(): TokenLike[] {
  const placeables = canvas?.tokens?.placeables ?? [];
  return placeables.map((token) => ({
    id: token.id,
    name: token.name,
    img: token.document.texture?.src ?? null,
    actor: (token.actor as GurpsActorLike | null | undefined) ?? null,
    isOwner: token.isOwner,
  }));
}

/**
 * The actor behind the user's first targeted token -- Foundry's `T` key. Attacks are aimed at a
 * target's body, so the hit location table comes from here, whoever the strip is showing.
 */
export function targetedActor(): GurpsActorLike | null {
  const token = game.user?.targets.first();
  return (token?.actor as GurpsActorLike | null | undefined) ?? null;
}

/** Hands the roll to the Game Aid so it goes through the modifier bucket and chat like any other. */
export function executeOtf(otf: string, actor: GurpsActorLike | null, event?: Event): void {
  const api = gameAid();
  if (!api) {
    warn("GURPS Game Aid is not available; cannot roll", otf);
    return;
  }

  void api.executeOTF(otf, false, event ?? null, actor);
}

/**
 * Postures are status effects in the Game Aid, and `replacePosture` swaps whichever is active for
 * the new one -- or, given "standing", clears it -- so the token icon and move penalty follow.
 */
export async function setPosture(actor: GurpsActorLike | null, id: string): Promise<void> {
  if (!actor?.replacePosture) return;
  await actor.replacePosture(id);
}

export function openSheet(actor: GurpsActorLike | null): void {
  actor?.sheet?.render(true);
}

export type Pool = "HP" | "FP";

/**
 * Writes a new current value for HP or FP through the actor, so the Game Aid's own hooks -- reeling
 * and exhausted flags, the sheet, token bars -- all see the change as if the sheet had made it.
 */
export async function updatePool(
  actor: GurpsActorLike | null,
  pool: Pool,
  value: number,
): Promise<void> {
  if (!actor?.update) return;
  await actor.update({ [`system.${pool}.value`]: value });
}

/**
 * Pushes a modifier into the bucket ahead of a roll -- the same thing clicking a hit location's
 * penalty on the sheet does. The Game Aid empties the bucket after the roll unless it is pinned.
 */
export function addBucketModifier(mod: number, reason: string): void {
  gameAid()?.ModifierBucket?.addModifier(mod, reason);
}

/**
 * Whether the Game Aid will accept a maneuver for this actor. It models maneuvers as active effects
 * on the token and only stores them for a token in the active combat -- `GurpsToken#setManeuver` is
 * a deliberate no-op otherwise -- so the pill mirrors that rather than pretending to hold a choice.
 */
export function canSetManeuver(actor: GurpsActorLike | null): boolean {
  const combat = game.combats?.active;
  if (!actor || !combat) return false;

  return combat.combatants.some((combatant) => combatant.actor?.id === actor.id);
}

/** Applies the maneuver through the system, so its active effect, icon and move override all follow. */
export async function setManeuver(actor: GurpsActorLike | null, maneuverId: string): Promise<void> {
  const replaceManeuver = (actor as { replaceManeuver?: (id: string) => Promise<void> } | null)
    ?.replaceManeuver;
  if (typeof replaceManeuver !== "function") return;

  await replaceManeuver.call(actor, maneuverId);
}

/**
 * Labels a maneuver the HUD's own menu doesn't offer. The Game Aid knows more than the menu lists --
 * the On Target additions -- and any of them can be set from the token HUD, so ask the system for
 * its own localized name rather than misreporting it as something else.
 */
export function maneuverLabel(id: string): string {
  const maneuver = gameAid()?.Maneuvers?.getManeuver(id);
  const label = maneuver?.label ?? maneuver?.name;
  return label ? localize(label) : id;
}

export interface MacroSlot {
  slot: number;
  /** The digit that triggers this slot: slot 10 is the `0` key. */
  hotkey: string;
  name: string | null;
  img: string | null;
  /** Identifies the macro to Foundry when one is dragged out of the bar. */
  uuid: string | null;
}

/** One page of the hotbar: ten slots, numbered within the 1-50 range shared by every page. */
export interface MacroPage {
  page: number;
  slots: MacroSlot[];
}

/** Foundry's hotbar is five pages of ten, and slot numbers run 1-50 across all of them. */
export const HOTBAR_PAGES = 5;
const SLOTS_PER_PAGE = 10;

/** Which page a slot number belongs to, so a slot can be looked up without knowing the page. */
function pageOfSlot(slot: number): number {
  return Math.ceil(slot / SLOTS_PER_PAGE);
}

function macroAtSlot(slot: number): Macro.Stored | null {
  const macros = game.user?.getHotbarMacros(pageOfSlot(slot)) ?? [];
  return macros.find((entry) => entry.slot === slot)?.macro ?? null;
}

/** The page the number-key hotkeys currently address. */
export function hotbarPage(): number {
  return ui.hotbar?.page ?? 1;
}

/**
 * Points the number-key hotkeys at another page. The HUD tracks the page itself -- the stock bar is
 * hidden, so nothing else would show it -- but Foundry owns the key handlers, so it has to agree.
 */
export function changeHotbarPage(page: number): void {
  void ui.hotbar?.changePage(page);
}

/** Every page of the hotbar -- the HUD's macro footer replaces the stock macro bar entirely. */
export function hotbarPages(): MacroPage[] {
  return Array.from({ length: HOTBAR_PAGES }, (_, index) => ({
    page: index + 1,
    slots: hotbarSlots(index + 1),
  }));
}

export function hotbarSlots(page: number): MacroSlot[] {
  const macros = game.user?.getHotbarMacros(page) ?? [];

  return macros.map(({ slot, macro }) => ({
    slot,
    hotkey: String(slot % SLOTS_PER_PAGE),
    name: macro?.name ?? null,
    img: macro?.img ?? null,
    uuid: macro?.uuid ?? null,
  }));
}

export function executeMacroSlot(slot: number): void {
  void macroAtSlot(slot)?.execute();
}

/**
 * Moves a macro between slots. Foundry's own `fromSlot` handling clears the origin and swaps in
 * whatever occupied the destination, which is what the stock hotbar does on an internal drag.
 */
export async function moveMacroSlot(from: number, to: number): Promise<void> {
  if (from === to) return;

  const macro = macroAtSlot(from);
  if (!macro) return;

  await game.user?.assignHotbarMacro(macro, to, { fromSlot: from });
}

export async function removeMacroSlot(slot: number): Promise<void> {
  await game.user?.assignHotbarMacro(null, slot);
}

interface DroppableDocumentClass {
  fromDropData(data: object): Promise<foundry.abstract.Document.Any | null | undefined>;
  create(data: object): Promise<foundry.abstract.Document.Any | undefined>;
}

/**
 * The HUD's footer stands in for the stock macro bar, so it has to accept the same drops -- with the
 * real bar hidden there would otherwise be nowhere to put anything. This mirrors `Hotbar#_onDrop`:
 * the `hotbarDrop` hook goes first, which is how the Game Aid turns a skill, attack or attribute
 * dragged off the character sheet into an On-The-Fly macro; only then do Foundry's own document
 * fallbacks run.
 */
export async function assignMacroSlot(slot: number, event: DragEvent): Promise<void> {
  const hotbar = ui.hotbar;
  if (!hotbar) return;

  const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(
    event,
  ) as Macro.DropData;
  if (!data || typeof data !== "object") return;

  if (Hooks.call("hotbarDrop", hotbar, data, slot) === false) return;
  if (hotbar.locked) return;

  const type = (data as { type?: string }).type;
  if (!type) return;
  // The drop may name any document type, so the class is looked up loosely and typed to the two
  // static methods this needs.
  const cls = (
    foundry.utils.getDocumentClass as unknown as (
      type: string,
    ) => DroppableDocumentClass | undefined
  )(type);
  const doc = await cls?.fromDropData(data);
  if (!doc) return;

  // The two document-to-macro helpers are protected on Hotbar; there is no public equivalent.
  const helpers = hotbar as unknown as {
    _createRollTableRollMacro(table: unknown): Promise<Macro.Implementation | undefined>;
    _createDocumentSheetToggle(doc: unknown): Promise<Macro.Implementation | undefined>;
  };

  let macro: Macro.Implementation | undefined;
  if (type === "Macro") {
    const existing = doc as Macro.Implementation;
    macro = game.macros?.has(existing.id!)
      ? existing
      : ((await cls!.create(existing.toObject())) as Macro.Implementation | undefined);
  } else if (type === "RollTable") macro = await helpers._createRollTableRollMacro(doc);
  else macro = await helpers._createDocumentSheetToggle(doc);

  if (!macro) return;
  await game.user?.assignHotbarMacro(macro as Macro.Stored, slot);
}
