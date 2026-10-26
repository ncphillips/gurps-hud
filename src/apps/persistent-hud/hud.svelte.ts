import {
  addBucketModifier,
  attackPicks,
  canSetManeuver,
  canvasTokens,
  currentActor,
  executeOtf,
  formatLocalized,
  localize,
  maneuverLabel,
  notifyWarning,
  saveAttackPicks,
  setCurrentActor,
  setManeuver,
  setPosture,
  clearShock,
  toggleShock,
  targetedActor,
} from "@/gurps/game-aid";
import { t } from "@/i18n";
import { warn } from "@/log";
import { actorChoices } from "@/gurps/actor-choices";
import type { ActorChoice } from "@/gurps/actor-choices";
import { allAttackPicks, buildHudView, buildTargetView, emptyHudView } from "@/gurps/hud-view";
import { isFromActor, nudgePick, placePick, removePick } from "@/gurps/attack-picks";
import type { AttackPicks, DroppedAttack } from "@/gurps/attack-picks";
import { isAttackOtf } from "@/gurps/otf";
import { maneuverById } from "@/gurps/maneuvers";
import type { AccCell } from "@/gurps/hud-view";
import type { GurpsActorLike } from "@/gurps/system-types";
import { currentHudPosition, currentMinimized, MINIMIZED_HOOK, POSITION_HOOK } from "@/settings";
import { MacroBarState } from "./macro-bar.svelte";
import type { Panel } from "./panels";
import { Revision } from "./revision.svelte";

const DEFAULT_TARGET = "Torso";

/**
 * Everything the persistent strip knows and does, short of the DOM. Construct it while a component
 * is initialising: it subscribes to Foundry's hooks in an effect owned by that component.
 */
export class Hud {
  #revision = new Revision();

  macroBar = new MacroBarState(this.#revision);

  // Raw, not proxied: these are Foundry documents mutated in place, and the switcher marks the
  // current choice by identity.
  actor = $state.raw<GurpsActorLike | null>(currentActor());
  targetActor = $state.raw<GurpsActorLike | null>(targetedActor());

  /**
   * Pins the strip to its actor so selecting other tokens no longer changes it. Only token selection
   * is held off: picking a character from the name menu still switches, lock or no lock.
   */
  locked = $state(false);

  openPanel = $state<Panel | null>(null);

  /**
   * Where attacks are aimed on the targeted token's body. The Game Aid has no such state of its
   * own -- its sheet pushes a location's penalty into the bucket per click -- so this lives here and
   * does the same push on every attack roll. It resets to the torso whenever the target changes.
   */
  target = $state(DEFAULT_TARGET);

  /**
   * A write that has not come back yet. A world's flag write goes to the server and returns through
   * `updateActor`, and until it does the actor still carries the old list -- so a second edit made
   * inside that gap, two Deletes in a row, would be computed from the list before the first one and
   * put the first attack back. The pending list stands in for the flag until the flag catches up,
   * and it is stamped with whose it is so switching characters mid-write shows the new one's picks.
   */
  #pending = $state.raw<{ actorId: string | null; picks: AttackPicks } | null>(null);

  #closeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Which attacks the strip shows, read off the actor rather than held here: the flag is the record,
   * and every write to it comes back through `updateActor` like any other change to the character.
   */
  #saved = $derived(this.#revision.read(() => attackPicks(this.actor)));

  picks = $derived(
    this.#pending && this.#pending.actorId === (this.actor?.id ?? null)
      ? this.#pending.picks
      : this.#saved,
  );

  /*
   * The strip is always on screen, so with nothing selected it renders the empty view rather than
   * disappearing: the macro bar stays reachable, and the name row invites picking somebody. Every
   * control that would act on an actor is switched off through `enabled`.
   */
  view = $derived(
    this.#revision.read(() =>
      this.actor ? buildHudView(this.actor, localize, this.picks) : emptyHudView(),
    ),
  );
  enabled = $derived(this.actor !== null);
  targetView = $derived(this.#revision.read(() => buildTargetView(this.targetActor)));
  choices = $derived(this.#revision.read(() => actorChoices(canvasTokens())));

  /**
   * Folded down to the Expand button and the macro footer, so the strip can get out of the way
   * without its macros going with it. Read back from the setting, like the hotbar, because the
   * keybinding changes it too.
   */
  minimized = $derived(this.#revision.read(currentMinimized));

  /** Where the reader dropped the strip, or `null` while it is docked. */
  position = $derived(this.#revision.read(currentHudPosition));

  /**
   * The maneuver comes from the actor, never from local state: whatever set it -- this menu, the
   * token HUD, the character sheet -- the pill reports what the actor is actually performing. Ids
   * outside our menu are labelled by the system so an On Target maneuver still reads correctly.
   */
  maneuver = $derived.by(() => {
    const id = this.view.maneuverId;
    if (!id) return null;
    return maneuverById(id) ?? { id, name: maneuverLabel(id), hint: "" };
  });

  maneuverEnabled = $derived(this.#revision.read(() => canSetManeuver(this.actor)));

  targetLocation = $derived(
    this.targetView?.hitLocations.find((location) => location.where === this.target) ?? null,
  );

  constructor() {
    $effect(() => {
      // Re-reading the actor on every hook, rather than only on `updateLastActorGURPS`, keeps the
      // strip correct when a token is selected before the Game Aid gets round to announcing it.
      const refresh = () => {
        if (!this.locked || !this.actor) this.actor = currentActor();
        const targetActor = targetedActor();
        if (targetActor?.id !== this.targetActor?.id) this.target = DEFAULT_TARGET;
        this.targetActor = targetActor;
        this.#revision.bump();
      };

      const refreshed = [
        "updateLastActorGURPS",
        "controlToken",
        "updateCombat",
        "deleteCombat",
        "createCombatant",
        "deleteCombatant",
        "updateActor",
        "updateToken",
        "createActiveEffect",
        "updateActiveEffect",
        "deleteActiveEffect",
        "updateUser",
        "targetToken",
        "canvasReady",
        "createToken",
        "deleteToken",
        // World settings are documents, so this is how the Game Aid's Use Quintessence arrives.
        "updateSetting",
        "gurps-hud.hotbarMode",
      ] as const;
      for (const hook of refreshed) Hooks.on(hook, refresh);

      // A panel open when the strip folds would otherwise reappear on expanding: its trigger is
      // unmounted rather than left, so no `mouseleave` ever arrives to close it.
      const fold = () => {
        this.openPanel = null;
        this.#revision.bump();
      };
      Hooks.on(MINIMIZED_HOOK, fold);
      Hooks.on(POSITION_HOOK, refresh);

      return () => {
        for (const hook of refreshed) Hooks.off(hook, refresh);
        Hooks.off(MINIMIZED_HOOK, fold);
        Hooks.off(POSITION_HOOK, refresh);
        if (this.#closeTimer) clearTimeout(this.#closeTimer);
      };
    });
  }

  // Arrow properties rather than methods: the strip hands these straight to child components as
  // callbacks, which would otherwise lose `this`.

  open = (panel: Panel): void => {
    if (this.#closeTimer) clearTimeout(this.#closeTimer);
    this.openPanel = panel;
  };

  /** A short delay so diagonal mouse travel from the trigger into the panel doesn't dismiss it. */
  close = (): void => {
    if (this.#closeTimer) clearTimeout(this.#closeTimer);
    this.#closeTimer = setTimeout(() => (this.openPanel = null), 120);
  };

  roll = (otf: string, event: MouseEvent): void => {
    const location = this.targetLocation;
    if (isAttackOtf(otf) && location && location.penalty !== 0) {
      addBucketModifier(location.penalty, t("rolls.toHit", { location: location.where }));
    }
    executeOtf(otf, this.actor, event);
  };

  addAcc = (acc: AccCell): void => {
    if (acc.mod === null) return;
    addBucketModifier(acc.mod, formatLocalized("GURPS.accForWeapon", { weapon: acc.weapon }));
  };

  selectTarget = (where: string): void => {
    this.openPanel = null;
    this.target = where;
  };

  selectManeuver = (id: string): void => {
    this.openPanel = null;
    void setManeuver(this.actor, id);
  };

  selectPosture = (id: string): void => {
    this.openPanel = null;
    void setPosture(this.actor, id);
  };

  toggleShock = (penalty: number): void => {
    void toggleShock(this.actor, penalty);
  };

  clearShock = (): void => {
    void clearShock(this.actor);
  };

  /**
   * Switches the strip -- and the Game Aid's notion of who is acting -- to another actor without
   * touching token selection. The strip's own actor is set directly because, when locked, the
   * `updateLastActorGURPS` hook this fires is deliberately ignored.
   */
  selectActor = (choice: ActorChoice): void => {
    this.openPanel = null;
    this.actor = choice.actor;
    setCurrentActor(choice.actor, choice.key);
  };

  toggleLock = (): void => {
    this.locked = !this.locked;
    // Unlocking hands control back to whichever token is selected right now.
    if (!this.locked) this.actor = currentActor() ?? this.actor;
  };

  /**
   * An attack dropped on the tables, from a character sheet or from the tables themselves. The
   * sheet stamps its own actor id onto every row it hands out, so an attack dragged off Bob's sheet
   * is refused by Greg's strip instead of quietly becoming an attack Greg cannot make.
   */
  placeAttack = (dropped: DroppedAttack | null, before: string | null): void => {
    if (!dropped || !this.actor) return;

    if (!isFromActor(dropped, this.actor.id)) {
      notifyWarning(t("weapons.wrongActor", { name: this.actor.name }));
      return;
    }

    this.#savePicks(placePick(this.picks, dropped.key, before));
  };

  removeAttack = (key: string): void => {
    this.#savePicks(removePick(this.picks, key));
  };

  nudgeAttack = (key: string, step: number): void => {
    this.#savePicks(nudgePick(this.picks, key, step));
  };

  pickAllAttacks = (): void => {
    if (this.actor) this.#savePicks(allAttackPicks(this.actor.system));
  };

  /**
   * Shows the edit at once and writes it, then hands the answer back to the actor. A refused write
   * -- a player curating a token they do not own -- drops the pending list, so the strip snaps back
   * to what the character actually carries rather than showing an edit that never happened.
   */
  #savePicks(next: AttackPicks): void {
    const write = { actorId: this.actor?.id ?? null, picks: next };
    this.#pending = write;

    saveAttackPicks(this.actor, next)
      .catch((reason: unknown) => warn("could not save the picked attacks", reason))
      .finally(() => {
        if (this.#pending === write) this.#pending = null;
      });
  }
}
