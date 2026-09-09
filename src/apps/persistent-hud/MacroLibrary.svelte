<script lang="ts">
  import type { MacroPage } from "@/gurps/game-aid";
  import { t } from "@/i18n";
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

<div bind:this={grid} data-hud-macro-library class="hud:w-fit hud:p-[6px]">
  <div
    class="hud:mb-[5px] hud:flex hud:items-baseline hud:justify-between hud:gap-[10px] hud:px-[2px] hud:font-hud-mono hud:text-[8px] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/40"
  >
    <span>{t("macros.library.label")}</span>
    <span
      class="hud:font-hud hud:text-[9.5px] hud:font-medium hud:tracking-normal hud:normal-case hud:text-hud-ink/30"
    >
      {t("macros.library.hint")}
    </span>
  </div>

  <div class="hud:flex hud:flex-col hud:gap-[3px]">
    {#each pages as entry (entry.page)}
      <div class="hud:flex hud:items-center hud:gap-[6px]">
        <button
          type="button"
          title={t("macros.library.switchPage", { page: entry.page })}
          aria-current={entry.page === page ? "true" : undefined}
          class={[
            "hud:h-[22px] hud:w-[22px] hud:flex-none hud:cursor-pointer hud:rounded-hud-sm hud:border hud:text-center hud:font-hud-mono hud:text-[11px]/[20px] hud:font-bold hud:transition-colors hud:duration-75 hud:hover:border-hud-accent hud:hover:text-hud-ink",
            entry.page === page
              ? "hud:border-hud-accent hud:bg-hud-accent/22 hud:text-hud-accent"
              : "hud:border-transparent hud:bg-white/[.05] hud:text-hud-ink/35",
          ]}
          onclick={() => onpage(entry.page)}
        >
          {entry.page}
        </button>

        <div class="hud:flex hud:gap-[3px]">
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
