<script lang="ts">
  import type { HudView, Tone } from "@/gurps/hud-view";
  import AttrsPanel from "./AttrsPanel.svelte";

  let {
    view,
    open,
    onopen,
    onclose,
    onroll,
  }: {
    view: HudView;
    open: boolean;
    onopen: () => void;
    onclose: () => void;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const ENC_TONE: Record<Tone, string> = {
    ok: "text-hud-ok",
    warn: "text-hud-accent",
    danger: "text-hud-hp",
  };

  const STAT_ROW =
    "flex items-baseline justify-between rounded-hud-sm bg-white/5 px-[7px] py-[3px]";
  const STAT_LABEL = "font-hud text-[10.5px] font-semibold text-hud-ink/50";
</script>

<div
  class="relative flex w-[115px] flex-none flex-col gap-[4px] border-r border-white/[.08] p-[9px]"
>
  <!-- The panel is positioned against the column, so it sits above the strip rather than over its top edge. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div data-hud-trigger="attrs" onmouseenter={onopen} onmouseleave={onclose}>
    <div
      class="group flex items-center justify-between rounded-hud-sm border border-white/[.09] bg-white/[.06] px-[7px] py-[3px] transition-colors duration-75 hover:border-hud-accent hover:bg-hud-accent"
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
    {#if open}
      <AttrsPanel basic={view.attrs.basic} secondary={view.attrs.secondary} {onroll} />
    {/if}
  </div>

  <div
    class="flex items-center justify-between rounded-hud-sm border border-transparent px-[7px] py-[3px] transition-colors duration-75 hover:border-hud-defence/45 hover:bg-hud-defence-bg"
  >
    <span class="font-hud text-[10.5px] font-semibold text-hud-ink/60">Dodge</span>
    <button
      type="button"
      title="Roll this defence"
      class="cursor-pointer rounded-hud-sm bg-transparent py-px font-hud-mono text-[15px] font-bold text-hud-defence transition-colors duration-75 hover:bg-hud-defence hover:text-hud-on-accent"
      onclick={(event) => onroll("Dodge", event)}
    >
      {view.dodge}
    </button>
  </div>

  <div class={STAT_ROW}>
    <span class={STAT_LABEL}>Move</span>
    <span class="font-hud-mono text-[12px] font-bold text-hud-ink">{view.move}</span>
  </div>

  <div class={STAT_ROW} title="Encumbrance level">
    <span class={STAT_LABEL}>Enc</span>
    <span class="font-hud-mono text-[11px] font-bold {ENC_TONE[view.encumbrance.tone]}">
      {view.encumbrance.label}
    </span>
  </div>
</div>
