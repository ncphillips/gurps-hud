<script lang="ts">
  import type { MacroPage } from "@/gurps/game-aid";
  import type { MacroDrag } from "./macro-drag";
  import MacroSlotButton from "./MacroSlotButton.svelte";
  import { tick } from "svelte";

  /**
   * Every hotbar page at once, one row per page: the bar alone can only show ten of fifty macros,
   * and nothing else in the HUD can reach the other forty. A row's page number switches the bar to
   * that page, and dragging moves a macro anywhere in the grid, including across pages. Removing a
   * macro is right-click or Delete, the same as in the bar.
   */
  let {
    pages,
    page,
    drag = $bindable(),
    onexecute,
    onassign,
    onmove,
    onremove,
    onpage,
  }: {
    pages: MacroPage[];
    /** The page the bar is showing, and the one the number-key hotkeys address. */
    page: number;
    /** Shared with the bar so a macro can be dragged from one into the other. */
    drag: MacroDrag;
    onexecute: (slot: number) => void;
    onassign: (slot: number, event: DragEvent) => void;
    onmove: (from: number, to: number) => void;
    onremove: (slot: number) => void;
    onpage: (page: number) => void;
  } = $props();

  /**
   * Alt+Arrow reads as a move through the grid the library actually draws: left and right stay on
   * the page, up and down carry the macro to the same column of the page above or below. Falling
   * off any edge does nothing rather than wrapping, so a held key cannot walk a macro off a page
   * the user is not looking at.
   */
  async function nudge(slot: number, dx: number, dy: number): Promise<void> {
    const row = pages.findIndex((entry) => entry.slots.some((each) => each.slot === slot));
    if (row === -1) return;

    const column = pages[row]!.slots.findIndex((each) => each.slot === slot);
    const target = pages[row + dy]?.slots[column + dx];
    if (!target) return;

    onmove(slot, target.slot);
    // Focus follows the macro, or a second Alt+Arrow walks whatever swapped into the old slot.
    await tick();
    grid?.querySelector<HTMLElement>(`[data-hud-macro-slot="${target.slot}"]`)?.focus();
  }

  /** Scoped to the grid: the bar renders the current page's slots a second time. */
  let grid = $state<HTMLElement | null>(null);
</script>

<div bind:this={grid} data-hud-macro-library class="w-fit p-[6px]">
  <div
    class="mb-[5px] flex items-baseline justify-between gap-[10px] px-[2px] font-hud-mono text-[8px] font-bold tracking-[.13em] text-hud-ink/40"
  >
    <span>ALL MACROS</span>
    <span class="font-hud text-[9.5px] font-medium tracking-normal normal-case text-hud-ink/30">
      Drag to reorder or move between pages
    </span>
  </div>

  <div class="flex flex-col gap-[3px]">
    {#each pages as entry (entry.page)}
      <div class="flex items-center gap-[6px]">
        <button
          type="button"
          title="Switch to page {entry.page}"
          aria-current={entry.page === page ? "true" : undefined}
          class={[
            "h-[22px] w-[22px] flex-none cursor-pointer rounded-hud-sm border text-center font-hud-mono text-[11px]/[20px] font-bold transition-colors duration-75 hover:border-hud-accent hover:text-hud-ink",
            entry.page === page
              ? "border-hud-accent bg-hud-accent/22 text-hud-accent"
              : "border-transparent bg-white/[.05] text-hud-ink/35",
          ]}
          onclick={() => onpage(entry.page)}
        >
          {entry.page}
        </button>

        <div class="flex gap-[3px]">
          {#each entry.slots as slot (slot.slot)}
            <MacroSlotButton
              {slot}
              bind:drag
              {onexecute}
              {onassign}
              {onmove}
              {onremove}
              onnudge={nudge}
            />
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
