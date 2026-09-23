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
  import { warn } from "@/log";
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
  import {
    currentHotbarMode,
    currentMinimized,
    MINIMIZED_HOOK,
    showsHudHotbar,
    toggleMinimized,
  } from "@/settings";
  import { tick } from "svelte";
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
  const saved = $derived(atRevision(revision, () => attackPicks(actor)));

  /**
   * A write that has not come back yet. A world's flag write goes to the server and returns through
   * `updateActor`, and until it does the actor still carries the old list -- so a second edit made
   * inside that gap, two Deletes in a row, would be computed from the list before the first one and
   * put the first attack back. The pending list stands in for the flag until the flag catches up,
   * and it is stamped with whose it is so switching characters mid-write shows the new one's picks.
   */
  let pending = $state.raw<{ actorId: string | null; picks: AttackPicks } | null>(null);

  const picks = $derived(
    pending && pending.actorId === (actor?.id ?? null) ? pending.picks : saved,
  );

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

  /**
   * Whether the strip draws a macro footer at all. A reader who has kept Foundry's own hotbar has
   * one already, and two bars over the same fifty slots is a bar too many.
   */
  const macroFooter = $derived(atRevision(revision, () => showsHudHotbar(currentHotbarMode())));
  const choices = $derived(atRevision(revision, () => actorChoices(canvasTokens())));

  /**
   * Folded down to the Expand button and the macro footer, so the strip can get out of the way
   * without its macros going with it. Read back from the setting, like the hotbar, because the
   * keybinding changes it too.
   */
  const minimized = $derived(atRevision(revision, currentMinimized));

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
      "gurps-hud.hotbarMode",
    ] as const;
    for (const hook of refreshed) Hooks.on(hook, refresh);

    // A panel open when the strip folds would otherwise reappear on expanding: its trigger is
    // unmounted rather than left, so no `mouseleave` ever arrives to close it.
    const fold = () => {
      openPanel = null;
      revision++;
    };
    Hooks.on(MINIMIZED_HOOK, fold);

    return () => {
      for (const hook of refreshed) Hooks.off(hook, refresh);
      Hooks.off(MINIMIZED_HOOK, fold);
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

  /**
   * Shows the edit at once and writes it, then hands the answer back to the actor. A refused write
   * -- a player curating a token they do not own -- drops the pending list, so the strip snaps back
   * to what the character actually carries rather than showing an edit that never happened.
   */
  function savePicks(next: AttackPicks): void {
    const write = { actorId: actor?.id ?? null, picks: next };
    pending = write;

    saveAttackPicks(actor, next)
      .catch((reason: unknown) => warn("could not save the picked attacks", reason))
      .finally(() => {
        if (pending === write) pending = null;
      });
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

  /**
   * The button that was clicked is unmounted by the click, so focus follows to the one that undoes
   * it. Only from the strip's own buttons: the keybinding can fire with focus anywhere, and pulling
   * it into the HUD from a chat box would be worse than leaving it.
   */
  async function toggleFromStrip(): Promise<void> {
    await toggleMinimized();
    await tick();
    document
      .querySelector<HTMLElement>(minimized ? "[data-hud-expand]" : "[data-hud-minimize]")
      ?.focus();
  }

  function toggleLock(): void {
    locked = !locked;
    // Unlocking hands control back to whichever token is selected right now.
    if (!locked) actor = currentActor() ?? actor;
  }
</script>

{#snippet macroBar(folded: boolean)}
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
    {folded}
  />
{/snippet}

{#if minimized}
  <div
    data-hud-strip
    class="gurps-hud-strip hud:flex hud:w-fit hud:rounded-hud hud:border hud:border-hud-veil/[.11] hud:bg-hud-panel hud:font-hud hud:text-hud-ink"
  >
    <div class="hud:flex hud:items-center hud:p-[6px]">
      <button
        type="button"
        data-hud-expand
        title={t("strip.expand")}
        class="hud:flex hud:h-[22px] hud:w-[22px] hud:flex-none hud:cursor-pointer hud:items-center hud:justify-center hud:rounded-hud-sm hud:border hud:border-transparent hud:bg-hud-veil/[.05] hud:text-hud-faint hud:transition-colors hud:duration-75 hud:hover:border-hud-veil/[.18] hud:hover:bg-hud-veil/[.1] hud:hover:text-hud-ink"
        onclick={toggleFromStrip}
      >
        <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden="true">
          <path d="M1.5 1.5h4V3H4.06L6 4.94 4.94 6 3 4.06V5.5H1.5z" />
          <path d="M10.5 10.5h-4V9h1.44L6 7.06 7.06 6 9 7.94V6.5h1.5z" />
        </svg>
      </button>
    </div>

    {#if macroFooter}
      {@render macroBar(true)}
    {/if}
  </div>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    data-hud-strip
    class="gurps-hud-strip hud:flex hud:max-h-hud-max hud:w-fit hud:rounded-hud hud:border hud:border-hud-veil/[.11] hud:bg-hud-panel hud:font-hud hud:text-hud-ink"
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
      onminimize={toggleFromStrip}
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

      {#if macroFooter}
        {@render macroBar(false)}
      {/if}
    </div>
  </div>
{/if}
