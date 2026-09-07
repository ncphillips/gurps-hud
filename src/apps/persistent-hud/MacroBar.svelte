<script lang="ts">
  import type { MacroSlot } from "@/gurps/game-aid";

  let {
    slots,
    onexecute,
    onassign,
    onmove,
    onremove,
  }: {
    slots: MacroSlot[];
    onexecute: (slot: number) => void;
    onassign: (slot: number, event: DragEvent) => void;
    onmove: (from: number, to: number) => void;
    onremove: (slot: number) => void;
  } = $props();

  /**
   * The slot a macro was picked up from. A drop is a reorder only if the drag started in the bar;
   * anything else is a macro, item or roll table arriving from elsewhere in Foundry.
   */
  let dragging = $state<number | null>(null);
  let dragOver = $state<number | null>(null);

  function dragStart(slot: MacroSlot, event: DragEvent): void {
    dragging = slot.slot;
    // Firefox will not start a drag with an empty payload, and a macro dragged out of the bar and
    // onto something else should look like any other Foundry macro drag -- naming the origin slot
    // so the stock hotbar moves it rather than duplicating it.
    event.dataTransfer?.setData(
      "text/plain",
      JSON.stringify({ type: "Macro", uuid: slot.uuid, slot: slot.slot }),
    );
  }

  function dragEnd(): void {
    dragging = null;
    dragOver = null;
  }

  function drop(slot: number, event: DragEvent): void {
    event.preventDefault();
    const from = dragging;
    dragEnd();

    if (from !== null) {
      if (from !== slot) onmove(from, slot);
      return;
    }

    onassign(slot, event);
  }

  function dragEnter(slot: number, event: DragEvent): void {
    event.preventDefault();
    dragOver = slot;
  }

  /** A drag that leaves the bar entirely never fires `dragend` here, so the highlight self-clears. */
  function dragLeave(slot: number): void {
    if (dragOver === slot) dragOver = null;
  }

  /**
   * Keyboard parity for the two things the mouse can do: Delete clears a slot, Alt+Arrow moves it.
   * Foundry's keybindings listen on the document, so a key we act on has to stop there -- otherwise
   * Delete would also delete whatever tokens are selected behind the strip.
   */
  function keydown(slot: MacroSlot, event: KeyboardEvent): void {
    if (event.key === "Delete" || event.key === "Backspace") {
      handled(event);
      onremove(slot.slot);
      return;
    }

    if (!event.altKey) return;

    const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (step === 0) return;

    const neighbour = slots[slots.indexOf(slot) + step];
    if (!neighbour) return;

    handled(event);
    onmove(slot.slot, neighbour.slot);
  }

  function handled(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
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
          draggable="true"
          data-hud-macro-slot={slot.slot}
          ondragstart={(event) => dragStart(slot, event)}
          ondragend={dragEnd}
          ondragover={(event) => event.preventDefault()}
          ondragenter={(event) => dragEnter(slot.slot, event)}
          ondragleave={() => dragLeave(slot.slot)}
          ondrop={(event) => drop(slot.slot, event)}
          onkeydown={(event) => keydown(slot, event)}
          oncontextmenu={(event) => {
            event.preventDefault();
            onremove(slot.slot);
          }}
          class={[
            "h-[22px] w-[22px] cursor-pointer overflow-hidden rounded-hud-sm text-center font-hud-mono text-[10px]/[22px] font-semibold text-hud-ink/50 transition-colors duration-75 hover:bg-hud-accent hover:text-hud-on-accent",
            dragOver === slot.slot ? "bg-hud-accent" : "bg-white/[.07]",
          ]}
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
          class={[
            "h-[22px] w-[22px] rounded-hud-sm border border-dashed bg-white/[.04]",
            dragOver === slot.slot ? "border-hud-accent" : "border-white/[.12]",
          ]}
          title="Slot {slot.hotkey} is empty -- drop a macro here"
          data-hud-macro-slot={slot.slot}
          ondragover={(event) => event.preventDefault()}
          ondragenter={(event) => dragEnter(slot.slot, event)}
          ondragleave={() => dragLeave(slot.slot)}
          ondrop={(event) => drop(slot.slot, event)}
        ></div>
      {/if}
    {/each}
  </div>

  <span
    class="font-hud text-[10.5px] font-medium whitespace-nowrap text-hud-ink/30"
    title="Slots 1–0 map to number-key hotkeys. Drag a macro to reorder it, right-click (or press Delete) to remove it."
  >
    1–0 hotkeys
  </span>
</div>
