<script lang="ts">
  import type { MacroPage } from "@/gurps/game-aid";
  import { t } from "@/i18n";
  import Popover from "@/ui/Popover.svelte";
  import MacroLibrary from "./MacroLibrary.svelte";
  import MacroSlotButton from "./MacroSlotButton.svelte";
  import { macroDrag } from "./macro-drag";
  import { tick } from "svelte";

  let {
    pages,
    page,
    onexecute,
    onassign,
    onmove,
    onremove,
    onpage,
  }: {
    pages: MacroPage[];
    /** The page the bar shows; the number-key hotkeys address the same one. */
    page: number;
    onexecute: (slot: number) => void;
    onassign: (slot: number, event: DragEvent) => void;
    onmove: (from: number, to: number) => void;
    onremove: (slot: number) => void;
    onpage: (page: number) => void;
  } = $props();

  const slots = $derived(pages.find((entry) => entry.page === page)?.slots ?? []);

  /** Owned here rather than per-slot so a macro can be dragged out of the bar into the library. */
  let drag = $state(macroDrag());

  let expanded = $state(false);

  /** The footer, so a pointer landing outside it can tell that it missed the library. */
  let footer = $state<HTMLElement | null>(null);

  /*
   * The library is the one panel opened by a click rather than a hover, so it cannot lean on the
   * strip's shared hover state to take it away again -- it needs the two dismissals a click-opened
   * panel is expected to have. Escape is taken in the capture phase and stopped: Foundry's own
   * keybindings listen on the document, and Escape there closes windows and opens the game menu.
   */
  $effect(() => {
    if (!expanded) return;

    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      expanded = false;
    };

    const outside = (event: PointerEvent) => {
      if (!footer?.contains(event.target as Node)) expanded = false;
    };

    document.addEventListener("keydown", escape, true);
    document.addEventListener("pointerdown", outside, true);

    return () => {
      document.removeEventListener("keydown", escape, true);
      document.removeEventListener("pointerdown", outside, true);
    };
  });

  /** Mirrors the stock hotbar's arrows, which cycle rather than stopping at the first and last page. */
  function cycle(direction: number): void {
    const last = pages.length;
    if (direction > 0) onpage(page < last ? page + 1 : 1);
    else onpage(page > 1 ? page - 1 : last);
  }

  /**
   * In the bar there is only one row, so a vertical nudge has nowhere to land.
   *
   * Focus follows the macro to its destination. The slot buttons are keyed by slot number, so the
   * move swaps which macro a button holds and leaves the button -- and the focus on it -- where it
   * was; without this, a second Alt+Arrow would walk whatever swapped in the other way.
   */
  async function nudge(slot: number, dx: number, dy: number): Promise<void> {
    if (dy !== 0) return;

    const neighbour = slots[slots.findIndex((each) => each.slot === slot) + dx];
    if (!neighbour) return;

    onmove(slot, neighbour.slot);
    await tick();
    bar?.querySelector<HTMLElement>(`[data-hud-macro-slot="${neighbour.slot}"]`)?.focus();
  }

  /** Scoped to the bar: the same slot is also rendered by the library, on its own page's row. */
  let bar = $state<HTMLElement | null>(null);

  /**
   * Deliberately smaller than the 32px slots they sit beside. The slots hold macro art a GM has to
   * recognise at a glance; paging and the library toggle are chrome, and the stock hotbar sets the
   * same hierarchy -- 50px macros, arrows a fraction of that. `items-center` on the row centres them.
   */
  const CONTROL =
    "hud:flex hud:h-[22px] hud:w-[22px] hud:flex-none hud:cursor-pointer hud:items-center hud:justify-center hud:rounded-hud-sm hud:border hud:border-transparent hud:bg-white/[.05] hud:text-hud-ink/45 hud:transition-colors hud:duration-75 hud:hover:border-white/[.18] hud:hover:bg-white/[.1] hud:hover:text-hud-ink";
</script>

<div
  bind:this={footer}
  class="hud:relative hud:flex hud:items-center hud:gap-[6px] hud:rounded-br-hud hud:border-t hud:border-white/[.08] hud:bg-hud-deep hud:px-[11px] hud:py-[6px]"
>
  <span
    class="hud:font-hud-mono hud:text-[8px] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/32"
    title={t("macros.hint")}
  >
    {t("macros.label")}
  </span>

  <div bind:this={bar} data-hud-macro-bar class="hud:flex hud:gap-[3px]">
    {#each slots as slot (slot.slot)}
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

  <div class="hud:flex hud:items-center hud:gap-[2px]">
    <button
      type="button"
      class={CONTROL}
      title={t("macros.previousPage")}
      onclick={() => cycle(-1)}
    >
      <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M8 1.5 3.5 6 8 10.5V1.5Z" />
      </svg>
    </button>

    <span
      data-hud-macro-page
      class="hud:w-[13px] hud:text-center hud:font-hud-mono hud:text-[11px] hud:font-bold hud:text-hud-ink/60"
      title={t("macros.page", { page, total: pages.length })}
    >
      {page}
    </span>

    <button type="button" class={CONTROL} title={t("macros.nextPage")} onclick={() => cycle(1)}>
      <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M4 1.5 8.5 6 4 10.5V1.5Z" />
      </svg>
    </button>
  </div>

  <button
    type="button"
    class={[
      CONTROL,
      expanded ? "hud:border-white/[.18] hud:bg-white/[.08] hud:text-hud-accent" : "",
    ]}
    title={expanded ? t("macros.hide") : t("macros.show")}
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden="true">
      {#if expanded}
        <path d="M1.5 4 6 8.5 10.5 4h-9Z" />
      {:else}
        <path d="M1.5 8 6 3.5 10.5 8h-9Z" />
      {/if}
    </svg>
  </button>

  {#if expanded}
    <Popover align="right">
      <MacroLibrary {pages} {page} bind:drag {onexecute} {onassign} {onmove} {onremove} {onpage} />
    </Popover>
  {/if}
</div>
