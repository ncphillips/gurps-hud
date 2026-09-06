<script lang="ts">
  import {
    assignMacroSlot,
    canSetManeuver,
    currentActor,
    executeMacroSlot,
    executeOtf,
    hotbarSlots,
    localize,
    maneuverLabel,
    setManeuver,
  } from "@/gurps/game-aid";
  import { buildHudView } from "@/gurps/hud-view";
  import { maneuverById } from "@/gurps/maneuvers";
  import type { GurpsActorLike } from "@/gurps/system-types";
  import AttrsColumn from "./AttrsColumn.svelte";
  import ManeuverBar from "./ManeuverBar.svelte";
  import MacroBar from "./MacroBar.svelte";
  import PortraitBlock from "./PortraitBlock.svelte";
  import WeaponTables from "./WeaponTables.svelte";

  let actor = $state<GurpsActorLike | null>(currentActor());

  /**
   * Foundry mutates actor documents in place, so there is nothing for Svelte to subscribe to. Every
   * hook that could change what the strip shows bumps this counter, and the derived view recomputes.
   */
  let revision = $state(0);

  let openPanel = $state<"attrs" | "maneuver" | null>(null);
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

  function open(panel: "attrs" | "maneuver"): void {
    if (closeTimer) clearTimeout(closeTimer);
    openPanel = panel;
  }

  /** A short delay so diagonal mouse travel from the trigger into the panel doesn't dismiss it. */
  function close(): void {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => (openPanel = null), 120);
  }

  function roll(otf: string, event: MouseEvent): void {
    executeOtf(otf, actor, event);
  }

  function selectManeuver(id: string): void {
    openPanel = null;
    void setManeuver(actor, id);
  }
</script>

{#if view}
  <div class="flex w-fit rounded-hud border border-white/[.11] bg-hud-panel font-hud text-hud-ink">
    <PortraitBlock {view} />

    <div class="flex min-w-0 flex-col">
      <div class="flex min-w-0">
        <AttrsColumn
          {view}
          open={openPanel === "attrs"}
          onopen={() => open("attrs")}
          onclose={close}
          onroll={roll}
        />

        <div class="flex min-w-0 flex-col">
          <ManeuverBar
            {maneuver}
            enabled={maneuverEnabled}
            open={openPanel === "maneuver"}
            onopen={() => open("maneuver")}
            onclose={close}
            onselect={selectManeuver}
          />
          <WeaponTables {view} onroll={roll} />
        </div>
      </div>

      <MacroBar
        slots={macroSlots}
        onexecute={executeMacroSlot}
        onassign={(slot, event) => void assignMacroSlot(slot, event)}
      />
    </div>
  </div>
{/if}
