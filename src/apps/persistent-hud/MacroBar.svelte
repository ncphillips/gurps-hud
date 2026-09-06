<script lang="ts">
  import type { MacroSlot } from "@/gurps/game-aid";

  let {
    slots,
    onexecute,
    onassign,
  }: {
    slots: MacroSlot[];
    onexecute: (slot: number) => void;
    onassign: (slot: number, event: DragEvent) => void;
  } = $props();

  function drop(slot: number, event: DragEvent): void {
    event.preventDefault();
    onassign(slot, event);
  }
</script>

<div
  class="flex items-center gap-[6px] rounded-br-hud border-t border-white/[.08] bg-hud-deep px-[11px] py-[6px]"
>
  <span class="font-hud-mono text-[8px] font-bold tracking-[.13em] text-hud-ink/32">MACROS</span>

  <div class="flex gap-[3px]">
    {#each slots as slot (slot.slot)}
      {#if slot.name}
        <button
          type="button"
          title={slot.name}
          ondragover={(event) => event.preventDefault()}
          ondrop={(event) => drop(slot.slot, event)}
          class="h-[22px] w-[22px] cursor-pointer overflow-hidden rounded-hud-sm bg-white/[.07] text-center font-hud-mono text-[10px]/[22px] font-semibold text-hud-ink/50 transition-colors duration-75 hover:bg-hud-accent hover:text-hud-on-accent"
          onclick={() => onexecute(slot.slot)}
        >
          {#if slot.img}
            <img src={slot.img} alt={slot.name} class="h-full w-full object-cover" />
          {:else}
            {slot.hotkey}
          {/if}
        </button>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="h-[22px] w-[22px] rounded-hud-sm border border-dashed border-white/[.12] bg-white/[.04]"
          title="Slot {slot.hotkey} is empty -- drop a macro here"
          ondragover={(event) => event.preventDefault()}
          ondrop={(event) => drop(slot.slot, event)}
        ></div>
      {/if}
    {/each}
  </div>

  <span
    class="font-hud text-[10.5px] font-medium whitespace-nowrap text-hud-ink/30"
    title="Slots 1–0 map to number-key hotkeys; assigned macros show their icon"
  >
    1–0 hotkeys
  </span>
</div>
