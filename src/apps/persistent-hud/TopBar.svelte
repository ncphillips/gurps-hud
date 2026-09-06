<script lang="ts">
  import type { HudView } from "@/gurps/hud-view";
  import { HUD_MANEUVERS } from "@/gurps/maneuvers";
  import type { HudManeuver } from "@/gurps/maneuvers";
  import AttrsPanel from "./AttrsPanel.svelte";

  export type Panel = "attrs" | "maneuver";

  /**
   * One row across the top of the strip: the maneuver pill, the three at-a-glance stats and the
   * attributes trigger. Both popovers anchor here so they open upward, clear of the strip.
   */
  let {
    view,
    maneuver,
    maneuverEnabled,
    openPanel,
    onopen,
    onclose,
    onselect,
    onroll,
  }: {
    view: HudView;
    /** What the actor is actually performing, or `null` when it has no maneuver. */
    maneuver: HudManeuver | null;
    /** False when the Game Aid would refuse the change -- the actor is not in the active combat. */
    maneuverEnabled: boolean;
    openPanel: Panel | null;
    onopen: (panel: Panel) => void;
    onclose: () => void;
    onselect: (id: string) => void;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const maneuverTitle = $derived(
    maneuverEnabled
      ? (maneuver?.hint ?? "Maneuver")
      : "Maneuvers can only be set for a token in the active combat",
  );

  const STAT = "flex items-baseline gap-[6px] rounded-hud-sm bg-white/5 px-[7px] py-[3px]";
  const STAT_LABEL = "font-hud text-[10.5px] font-semibold text-hud-ink/50";

  /*
   * The pill has a floor width so that switching between "Move" and "All-Out Defence" doesn't
   * change the width of the whole strip. Longer names still widen it.
   */

  /*
   * Popovers sit 16px above their trigger: the trigger's top is 10px inside the strip (1px border,
   * 9px padding), so this puts each panel 6px clear of the strip's top edge.
   */
  const POPOVER =
    "absolute bottom-[calc(100%+16px)] z-20 rounded-hud-lg border border-white/[.15] bg-hud-popover shadow-hud-popover";
</script>

<div class="flex items-center gap-[6px] px-[12px] pt-[9px] pb-[8px]">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative"
    data-hud-trigger="maneuver"
    onmouseenter={maneuverEnabled ? () => onopen("maneuver") : undefined}
    onmouseleave={onclose}
  >
    <div
      class="flex min-w-[170px] items-center gap-[9px] rounded-hud-md px-[11px] py-[5px] {maneuverEnabled
        ? 'bg-hud-accent'
        : 'bg-white/[.06]'}"
      title={maneuverTitle}
    >
      <span
        class="font-hud-mono text-[8px] font-bold tracking-[.14em] {maneuverEnabled
          ? 'text-hud-on-accent/60'
          : 'text-hud-ink/32'}"
      >
        MANEUVER
      </span>
      <span
        class="font-hud text-[15px]/none font-bold tracking-[.02em] whitespace-nowrap {maneuverEnabled
          ? 'text-hud-on-accent'
          : 'text-hud-ink/35'}"
      >
        {maneuver?.name ?? "—"}
      </span>
      {#if maneuverEnabled}
        <span class="font-hud-mono text-[9px] font-bold text-hud-on-accent/55">▴</span>
      {/if}
    </div>

    {#if openPanel === "maneuver" && maneuverEnabled}
      <div class="{POPOVER} left-0 grid w-[464px] grid-cols-2 gap-[2px] p-[5px]">
        {#each HUD_MANEUVERS as option (option.id)}
          {@const isSelected = option.id === maneuver?.id}
          <button
            type="button"
            class="flex cursor-pointer flex-col rounded-hud-sm px-[8px] py-[4px] text-left transition-colors duration-75 {isSelected
              ? 'bg-hud-accent'
              : 'bg-white/[.045] hover:bg-white/[.09]'}"
            onclick={() => onselect(option.id)}
          >
            <span
              class="font-hud text-[12.5px]/[1.15] font-semibold {isSelected
                ? 'text-hud-on-accent'
                : 'text-hud-ink/78'}"
            >
              {option.name}
            </span>
            <span
              class="font-hud text-[10px]/[1.2] font-medium {isSelected
                ? 'text-hud-on-accent/72'
                : 'text-hud-ink/38'}"
            >
              {option.hint}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <div class="mx-[4px] h-[18px] w-px bg-white/[.09]"></div>

  <div
    class="flex items-baseline gap-[6px] rounded-hud-sm border border-transparent px-[7px] py-[3px] transition-colors duration-75 hover:border-hud-defence/45 hover:bg-hud-defence-bg"
  >
    <span class={STAT_LABEL}>Dodge</span>
    <button
      type="button"
      title="Roll this defence"
      class="cursor-pointer rounded-hud-sm bg-transparent px-[3px] font-hud-mono text-[13px]/none font-bold text-hud-defence transition-colors duration-75 hover:bg-hud-defence hover:text-hud-on-accent"
      onclick={(event) => onroll("Dodge", event)}
    >
      {view.dodge}
    </button>
  </div>

  <div class={STAT}>
    <span class={STAT_LABEL}>Move</span>
    <span class="font-hud-mono text-[12px]/none font-bold text-hud-ink">{view.move}</span>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative ml-auto"
    data-hud-trigger="attrs"
    onmouseenter={() => onopen("attrs")}
    onmouseleave={onclose}
  >
    <div
      class="group flex items-center gap-[8px] rounded-hud-sm border border-white/[.09] bg-white/[.06] px-[7px] py-[4px] transition-colors duration-75 hover:border-hud-accent hover:bg-hud-accent"
      title="Attributes"
    >
      <span
        class="font-hud-mono text-[9px] font-bold tracking-[.12em] text-hud-ink/60 group-hover:text-hud-on-accent"
        >ATTRS</span
      >
      <span
        class="font-hud-mono text-[9px] font-bold text-hud-ink/45 group-hover:text-hud-on-accent/55"
        >▴</span
      >
    </div>
    {#if openPanel === "attrs"}
      <AttrsPanel
        basic={view.attrs.basic}
        secondary={view.attrs.secondary}
        class="{POPOVER} right-0"
        {onroll}
      />
    {/if}
  </div>
</div>
