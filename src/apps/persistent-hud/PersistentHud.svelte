<script lang="ts">
  import {
    addBucketModifier,
    assignMacroSlot,
    canSetManeuver,
    currentActor,
    executeMacroSlot,
    executeOtf,
    hotbarSlots,
    localize,
    maneuverLabel,
    openSheet,
    setManeuver,
    setPosture,
    updatePool,
  } from "@/gurps/game-aid";
  import { buildHudView } from "@/gurps/hud-view";
  import { isAttackOtf } from "@/gurps/otf";
  import { maneuverById } from "@/gurps/maneuvers";
  import type { GurpsActorLike } from "@/gurps/system-types";
  import MacroBar from "./MacroBar.svelte";
  import PortraitBlock from "./PortraitBlock.svelte";
  import TopBar from "./TopBar.svelte";
  import type { Panel } from "./panels";
  import WeaponTables from "./WeaponTables.svelte";

  let actor = $state<GurpsActorLike | null>(currentActor());

  /**
   * Foundry mutates actor documents in place, so there is nothing for Svelte to subscribe to. Every
   * hook that could change what the strip shows bumps this counter, and the derived view recomputes.
   */
  let revision = $state(0);

  let openPanel = $state<Panel | null>(null);

  /**
   * Where the actor is aiming. The Game Aid has no such state of its own -- its sheet pushes a
   * location's penalty into the bucket per click -- so this lives here and does the same push on
   * every attack roll. It resets to the torso whenever the strip follows a different actor.
   */
  const DEFAULT_TARGET = "Torso";
  let target = $state(DEFAULT_TARGET);
  let targetActorId = $state<string | null | undefined>(null);
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Makes `revision` an explicit input of a read, so bumping it re-runs the derivation. */
  function atRevision<T>(_revision: number, read: () => T): T {
    return read();
  }

  const view = $derived(atRevision(revision, () => (actor ? buildHudView(actor, localize) : null)));
  const macroSlots = $derived(atRevision(revision, hotbarSlots));

  /**
   * The maneuver comes from the actor, never from local state: whatever set it -- this menu, the
   * token HUD, the character sheet -- the pill reports what the actor is actually performing. Ids
   * outside our twelve are labelled by the system so a variant maneuver still reads correctly.
   */
  const maneuver = $derived.by(() => {
    const id = view?.maneuverId;
    if (!id) return null;
    return maneuverById(id) ?? { id, name: maneuverLabel(id), hint: "" };
  });

  const maneuverEnabled = $derived(atRevision(revision, () => canSetManeuver(actor)));

  const targetLocation = $derived(
    view?.hitLocations.find((location) => location.where === target) ?? null,
  );

  $effect(() => {
    if (actor?.id === targetActorId) return;
    targetActorId = actor?.id;
    target = DEFAULT_TARGET;
  });

  $effect(() => {
    // Re-reading the actor on every hook, rather than only on `updateLastActorGURPS`, keeps the
    // strip correct when a token is selected before the Game Aid gets round to announcing it.
    const refresh = () => {
      actor = currentActor();
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
      addBucketModifier(targetLocation.penalty, `to hit ${targetLocation.where}`);
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
</script>

{#if view}
  <div
    class="flex max-h-hud-max w-fit rounded-hud border border-white/[.11] bg-hud-panel font-hud text-hud-ink"
  >
    <PortraitBlock
      {view}
      onpool={(pool, value) => void updatePool(actor, pool, value)}
      onopensheet={() => openSheet(actor)}
      postureOpen={openPanel === "posture"}
      onposture={selectPosture}
      onopen={() => open("posture")}
      onclose={close}
    />

    <div class="flex min-h-0 min-w-0 flex-col">
      <TopBar
        {view}
        {maneuver}
        {maneuverEnabled}
        {openPanel}
        onopen={open}
        onclose={close}
        onselect={selectManeuver}
        {target}
        onselecttarget={selectTarget}
        onroll={roll}
      />
      <WeaponTables {view} onroll={roll} />

      <MacroBar
        slots={macroSlots}
        onexecute={executeMacroSlot}
        onassign={(slot, event) => void assignMacroSlot(slot, event)}
      />
    </div>
  </div>
{/if}
