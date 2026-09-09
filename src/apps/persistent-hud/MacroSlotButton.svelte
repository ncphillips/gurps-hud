<script lang="ts">
  import type { MacroSlot } from "@/gurps/game-aid";
  import { t } from "@/i18n";
  import type { MacroDrag } from "./macro-drag";

  /**
   * One hotbar slot, filled or empty. Used by both the bar and the library, which is why it knows
   * nothing about the shape it is laid out in: the parent turns an Alt+Arrow into a destination.
   */
  let {
    slot,
    drag = $bindable(),
    onexecute,
    onassign,
    onmove,
    onremove,
    onnudge,
  }: {
    slot: MacroSlot;
    /** Written to, not just read: picking a slot up and putting it down is what a drag is. */
    drag: MacroDrag;
    onexecute: (slot: number) => void;
    onassign: (slot: number, event: DragEvent) => void;
    onmove: (from: number, to: number) => void;
    onremove: (slot: number) => void;
    onnudge: (slot: number, dx: number, dy: number) => void;
  } = $props();

  function dragStart(event: DragEvent): void {
    drag.from = slot.slot;
    // Firefox will not start a drag with an empty payload, and a macro dragged out of the bar and
    // onto something else should look like any other Foundry macro drag -- naming the origin slot
    // so the stock hotbar moves it rather than duplicating it.
    //
    // Naming the slot is also what makes dragging a macro clear off the HUD remove it, which is the
    // only drag gesture that removes one: Foundry reads the origin slot off this payload and clears
    // it. That is the whole reason there is no remove drop-target in the library. Verified by hand
    // against a live world rather than read out of Foundry's source, so treat the shape of this
    // payload -- `slot` especially -- as load-bearing and re-check removal if it ever changes.
    event.dataTransfer?.setData(
      "text/plain",
      JSON.stringify({ type: "Macro", uuid: slot.uuid, slot: slot.slot }),
    );
  }

  function dragEnd(): void {
    drag.from = null;
    drag.over = null;
  }

  function drop(event: DragEvent): void {
    event.preventDefault();
    const from = drag.from;
    dragEnd();

    if (from !== null) {
      if (from !== slot.slot) onmove(from, slot.slot);
      return;
    }

    onassign(slot.slot, event);
  }

  function dragEnter(event: DragEvent): void {
    event.preventDefault();
    drag.over = slot.slot;
  }

  /** A drag that leaves the HUD entirely never fires `dragend` here, so the highlight self-clears. */
  function dragLeave(): void {
    if (drag.over === slot.slot) drag.over = null;
  }

  /**
   * Keyboard parity for the two things the mouse can do: Delete clears a slot, Alt+Arrow moves it.
   * Foundry's keybindings listen on the document, so a key we act on has to stop there -- otherwise
   * Delete would also delete whatever tokens are selected behind the strip. Alt+Arrow is swallowed
   * even at the edges of the grid, where nothing moves, because the browser reads it as history
   * navigation.
   */
  function keydown(event: KeyboardEvent): void {
    if (event.key === "Delete" || event.key === "Backspace") {
      handled(event);
      onremove(slot.slot);
      return;
    }

    if (!event.altKey) return;

    const step = NUDGES[event.key];
    if (!step) return;

    handled(event);
    onnudge(slot.slot, step.dx, step.dy);
  }

  const NUDGES: Record<string, { dx: number; dy: number } | undefined> = {
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 },
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
  };

  function handled(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Foundry's own controls -- the scene tools, the sidebar tabs -- are 32px, and its hotbar macros
   * are 50px. A slot takes the smaller of the two: the art has to be recognisable, but the footer
   * is one row of the strip and not a bar in its own right. Shared by the filled and empty branches
   * so they cannot drift apart, and by the library, which lays the other forty slots out in a grid.
   */
  const SIZE = "hud:h-[32px] hud:w-[32px]";
</script>

{#if slot.name}
  <button
    type="button"
    title={slot.name}
    draggable="true"
    data-hud-macro-slot={slot.slot}
    ondragstart={dragStart}
    ondragend={dragEnd}
    ondragover={(event) => event.preventDefault()}
    ondragenter={dragEnter}
    ondragleave={dragLeave}
    ondrop={drop}
    onkeydown={keydown}
    oncontextmenu={(event) => {
      event.preventDefault();
      onremove(slot.slot);
    }}
    class={[
      SIZE,
      "hud:cursor-pointer hud:overflow-hidden hud:rounded-hud-sm hud:text-center hud:font-hud-mono hud:text-[12px]/[32px] hud:font-semibold hud:text-hud-ink/50 hud:transition-colors hud:duration-75 hud:hover:bg-hud-accent hud:hover:text-hud-on-accent",
      drag.over === slot.slot ? "hud:bg-hud-accent" : "hud:bg-white/[.07]",
    ]}
    onclick={() => onexecute(slot.slot)}
  >
    {#if slot.img}
      <img src={slot.img} alt={slot.name} class="hud:h-full hud:w-full hud:object-cover" />
    {:else}
      {slot.hotkey}
    {/if}
  </button>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class={[
      SIZE,
      "hud:rounded-hud-sm hud:border hud:border-dashed hud:bg-white/[.04]",
      drag.over === slot.slot ? "hud:border-hud-accent" : "hud:border-white/[.12]",
    ]}
    title={t("macros.emptySlot", { hotkey: slot.hotkey })}
    data-hud-macro-slot={slot.slot}
    ondragover={(event) => event.preventDefault()}
    ondragenter={dragEnter}
    ondragleave={dragLeave}
    ondrop={drop}
  ></div>
{/if}
