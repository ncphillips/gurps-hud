<script lang="ts">
  import {
    addBucketModifier,
    assignMacroSlot,
    attackPicks,
    canSetManeuver,
    canvasTokens,
    changeHotbarPage,
    currentActor,
    executeMacroSlot,
    executeOtf,
    hotbarPage,
    hotbarPages,
    localize,
    maneuverLabel,
    moveMacroSlot,
    notifyWarning,
    openSheet,
    removeMacroSlot,
    saveAttackPicks,
    setCurrentActor,
    setManeuver,
    setPosture,
    targetedActor,
    updatePool,
  } from "@/gurps/game-aid";
  import { t } from "@/i18n";
  import { actorChoices } from "@/gurps/actor-choices";
  import type { ActorChoice } from "@/gurps/actor-choices";
  import { allAttackPicks, buildHudView, buildTargetView, emptyHudView } from "@/gurps/hud-view";
  import {
    droppedAttack,
    isFromActor,
    nudgePick,
    placePick,
    removePick,
  } from "@/gurps/attack-picks";
  import type { AttackPicks } from "@/gurps/attack-picks";
  import { attackDrag } from "./attack-drag";
  import { isAttackOtf } from "@/gurps/otf";
  import { maneuverById } from "@/gurps/maneuvers";
  import type { GurpsActorLike } from "@/gurps/system-types";
  import MacroBar from "./MacroBar.svelte";
  import PortraitBlock from "./PortraitBlock.svelte";
  import TopBar from "./TopBar.svelte";
  import type { Panel } from "./panels";
  import WeaponTables from "./WeaponTables.svelte";

  // Raw, not proxied: these are Foundry documents mutated in place, and the switcher marks the
  // current choice by identity.
  let actor = $state.raw<GurpsActorLike | null>(currentActor());
  let targetActor = $state.raw<GurpsActorLike | null>(targetedActor());

  /**
   * Pins the strip to its actor so selecting other tokens no longer changes it. Only token selection
   * is held off: picking a character from the name menu still switches, lock or no lock.
   */
  let locked = $state(false);

  /**
   * Foundry mutates actor documents in place, so there is nothing for Svelte to subscribe to. Every
   * hook that could change what the strip shows bumps this counter, and the derived view recomputes.
   */
  let revision = $state(0);

  let openPanel = $state<Panel | null>(null);

  /**
   * The attack being dragged around the tables. Owned here rather than by them because dropping an
   * attack anywhere on the strip has to count as landing: the gesture that removes one is dragging
   * it clear of the strip, so a drop on the top bar or the macro footer must read as a near miss
   * rather than as a deletion.
   */
  let drag = $state(attackDrag());

  /**
   * Where attacks are aimed on the targeted token's body. The Game Aid has no such state of its
   * own -- its sheet pushes a location's penalty into the bucket per click -- so this lives here and
   * does the same push on every attack roll. It resets to the torso whenever the target changes.
   */
  const DEFAULT_TARGET = "Torso";
  let target = $state(DEFAULT_TARGET);
  let targetActorId = $state<string | null | undefined>(null);
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Makes `revision` an explicit input of a read, so bumping it re-runs the derivation. */
  function atRevision<T>(_revision: number, read: () => T): T {
    return read();
  }

  /**
   * Which attacks the strip shows, read off the actor rather than held here: the flag is the record,
   * and every write to it comes back through `updateActor` like any other change to the character.
   */
  const picks = $derived(atRevision(revision, () => attackPicks(actor)));

  /*
   * The strip is always on screen, so with nothing selected it renders the empty view rather than
   * disappearing: the macro bar stays reachable, and the name row invites picking somebody. Every
   * control that would act on an actor is switched off through `enabled`.
   */
  const view = $derived(
    atRevision(revision, () => (actor ? buildHudView(actor, localize, picks) : emptyHudView())),
  );
  const enabled = $derived(actor !== null);
  const targetView = $derived(atRevision(revision, () => buildTargetView(targetActor)));
  const macroPages = $derived(atRevision(revision, hotbarPages));

  /**
   * Which hotbar page the macro footer shows. Read back from Foundry rather than kept alongside it:
   * a private copy only stays right for as long as the HUD is the only thing that ever changes the
   * page, and when a macro or another module changes it the footer and the number keys would
   * silently disagree about which ten slots are live. `changePage` announces itself through no hook
   * we watch, so the footer bumps `revision` itself after asking for the change.
   */
  const macroPage = $derived(atRevision(revision, hotbarPage));
  const choices = $derived(atRevision(revision, () => actorChoices(canvasTokens())));

  /**
   * The maneuver comes from the actor, never from local state: whatever set it -- this menu, the
   * token HUD, the character sheet -- the pill reports what the actor is actually performing. Ids
   * outside our menu are labelled by the system so an On Target maneuver still reads correctly.
   */
  const maneuver = $derived.by(() => {
    const id = view.maneuverId;
    if (!id) return null;
    return maneuverById(id) ?? { id, name: maneuverLabel(id), hint: "" };
  });

  const maneuverEnabled = $derived(atRevision(revision, () => canSetManeuver(actor)));

  const targetLocation = $derived(
    targetView?.hitLocations.find((location) => location.where === target) ?? null,
  );

  $effect(() => {
    if (targetActor?.id === targetActorId) return;
    targetActorId = targetActor?.id;
    target = DEFAULT_TARGET;
  });

  $effect(() => {
    // Re-reading the actor on every hook, rather than only on `updateLastActorGURPS`, keeps the
    // strip correct when a token is selected before the Game Aid gets round to announcing it.
    const refresh = () => {
      if (!locked || !actor) actor = currentActor();
      targetActor = targetedActor();
      revision++;
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
    ] as const;
    for (const hook of refreshed) Hooks.on(hook, refresh);

    return () => {
      for (const hook of refreshed) Hooks.off(hook, refresh);
      if (closeTimer) clearTimeout(closeTimer);
    };
  });

  function open(panel: Panel): void {
    if (closeTimer) clearTimeout(closeTimer);
    openPanel = panel;
  }

  /** A short delay so diagonal mouse travel from the trigger into the panel doesn't dismiss it. */
  function close(): void {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => (openPanel = null), 120);
  }

  function roll(otf: string, event: MouseEvent): void {
    if (isAttackOtf(otf) && targetLocation && targetLocation.penalty !== 0) {
      addBucketModifier(
        targetLocation.penalty,
        t("rolls.toHit", { location: targetLocation.where }),
      );
    }
    executeOtf(otf, actor, event);
  }

  function selectTarget(where: string): void {
    openPanel = null;
    target = where;
  }

  function selectManeuver(id: string): void {
    openPanel = null;
    void setManeuver(actor, id);
  }

  function selectPosture(id: string): void {
    openPanel = null;
    void setPosture(actor, id);
  }

  /**
   * Switches the strip -- and the Game Aid's notion of who is acting -- to another actor without
   * touching token selection. The strip's own actor is set directly because, when locked, the
   * `updateLastActorGURPS` hook this fires is deliberately ignored.
   */
  function selectActor(choice: ActorChoice): void {
    openPanel = null;
    actor = choice.actor;
    setCurrentActor(choice.actor, choice.key);
  }

  function savePicks(next: AttackPicks): void {
    void saveAttackPicks(actor, next);
  }

  /**
   * A drop on the attack tables, from a character sheet or from the tables themselves. The actor
   * check is the point of taking the raw event this far up: the sheet stamps its own actor id onto
   * every row it hands out, so an attack dragged off Bob's sheet is refused by Greg's strip instead
   * of quietly becoming an attack Greg cannot make.
   */
  function placeAttack(event: DragEvent, before: string | null): void {
    const dropped = droppedAttack(event.dataTransfer?.getData("text/plain"));
    if (!dropped || !actor) return;

    if (!isFromActor(dropped, actor.id)) {
      notifyWarning(t("weapons.wrongActor", { name: actor.name }));
      return;
    }

    savePicks(placePick(picks, dropped.key, before));
  }

  function toggleLock(): void {
    locked = !locked;
    // Unlocking hands control back to whichever token is selected right now.
    if (!locked) actor = currentActor() ?? actor;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="hud:flex hud:max-h-hud-max hud:w-fit hud:rounded-hud hud:border hud:border-white/[.11] hud:bg-hud-panel hud:font-hud hud:text-hud-ink"
  ondragover={(event) => {
    if (drag.from !== null) event.preventDefault();
  }}
  ondrop={() => (drag.landed = true)}
>
  <PortraitBlock
    {view}
    {enabled}
    {actor}
    onpool={(pool, value) => void updatePool(actor, pool, value)}
    onopensheet={() => openSheet(actor)}
    {locked}
    ontogglelock={toggleLock}
    {choices}
    onselectactor={selectActor}
    {openPanel}
    onposture={selectPosture}
    onopen={open}
    onclose={close}
  />

  <div class="hud:flex hud:min-h-0 hud:min-w-0 hud:flex-col">
    <TopBar
      {view}
      {enabled}
      {maneuver}
      {maneuverEnabled}
      {openPanel}
      onopen={open}
      onclose={close}
      onselect={selectManeuver}
      {targetView}
      {target}
      onselecttarget={selectTarget}
      onroll={roll}
    />
    <WeaponTables
      {view}
      {enabled}
      actorId={actor?.id ?? null}
      bind:drag
      onroll={roll}
      onplace={placeAttack}
      onremove={(key) => savePicks(removePick(picks, key))}
      onnudge={(key, step) => savePicks(nudgePick(picks, key, step))}
      onpickall={() => actor && savePicks(allAttackPicks(actor.system))}
    />

    <MacroBar
      pages={macroPages}
      page={macroPage}
      onpage={(page) => {
        changeHotbarPage(page);
        revision++;
      }}
      onexecute={executeMacroSlot}
      onassign={(slot, event) => void assignMacroSlot(slot, event)}
      onmove={(from, to) => void moveMacroSlot(from, to)}
      onremove={(slot) => void removeMacroSlot(slot)}
    />
  </div>
</div>
