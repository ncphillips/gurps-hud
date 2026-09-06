import type { GurpsActorLike } from "./system-types";
import { warn } from "@/log";

/**
 * The GURPS 4e Game Aid publishes its API on a `GURPS` global rather than through the module API,
 * so this file is the one place that touches it. Everything is defensive: the HUD should degrade to
 * a read-only readout if the system changes shape, not throw inside a Svelte render.
 */

interface GameAidGlobal {
  LastActor: GurpsActorLike | null;
  executeOTF(otf: string, priv?: boolean, event?: Event | null, actor?: unknown): Promise<boolean>;
  Maneuvers?: {
    /** Resolves any maneuver id the system knows, falling back to Do Nothing. */
    getManeuver(id?: string): { label?: string; name?: string } | undefined;
  };
}

declare global {
  var GURPS: GameAidGlobal | undefined;
}

export function gameAid(): GameAidGlobal | undefined {
  return globalThis.GURPS;
}

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
 * Labels a maneuver the HUD's own menu doesn't offer. The Game Aid has far more than twelve -- every
 * All-Out Attack variant, the On Target additions -- and any of them can be set from the token HUD,
 * so ask the system for its own localized name rather than misreporting it as something else.
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
}

/** The current hotbar page, as ten slots -- the HUD's macro footer replaces the stock macro bar. */
export function hotbarSlots(): MacroSlot[] {
  const page = ui.hotbar?.page ?? 1;
  const macros = game.user?.getHotbarMacros(page) ?? [];

  return macros.map(({ slot, macro }) => ({
    slot,
    hotkey: String(slot % 10),
    name: macro?.name ?? null,
    img: macro?.img ?? null,
  }));
}

export function executeMacroSlot(slot: number): void {
  const page = ui.hotbar?.page ?? 1;
  const macro = game.user?.getHotbarMacros(page)?.find((entry) => entry.slot === slot)?.macro;
  void macro?.execute();
}

/**
 * The HUD's footer stands in for the stock macro bar, so it has to accept the same drops -- with the
 * real bar hidden there would otherwise be nowhere to put a macro.
 */
export async function assignMacroSlot(slot: number, event: DragEvent): Promise<void> {
  const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event) as {
    type?: string;
    uuid?: string;
  } | null;
  if (data?.type !== "Macro" || !data.uuid) return;

  const macro = await fromUuid(data.uuid);
  if (!(macro instanceof Macro)) return;

  await game.user?.assignHotbarMacro(macro as Macro.Stored, slot);
}
