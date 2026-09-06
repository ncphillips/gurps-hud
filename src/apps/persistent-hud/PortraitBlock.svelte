<script lang="ts">
  import type { HudView, Tone } from "@/gurps/hud-view";
  import type { Pool } from "@/gurps/game-aid";
  import PoolField from "./PoolField.svelte";
  import VitalIcon from "./VitalIcon.svelte";

  let {
    view,
    onpool,
    onopensheet,
    postureOpen,
    onposture,
    onopen,
    onclose,
  }: {
    view: HudView;
    onpool: (pool: Pool, value: number) => void;
    onopensheet: () => void;
    postureOpen: boolean;
    onposture: (id: string) => void;
    onopen: () => void;
    onclose: () => void;
  } = $props();

  const TONE_TEXT: Record<Tone, string> = {
    ok: "text-hud-ok",
    warn: "text-hud-accent",
    danger: "text-hud-hp",
  };

  const idle = $derived(view.condition.label === "—");

  const VITAL_BOX =
    "flex-1 rounded-hud-xs bg-white/[.07] px-[4px] py-px text-right font-hud-mono text-[12px]/[1.35] font-bold";
</script>

<div
  class="flex w-[143px] flex-none flex-col rounded-l-hud border-r border-white/[.08] bg-hud-deep"
>
  <div
    class="truncate px-[7px] py-[2px] text-center font-hud text-[12.5px]/[1.25] font-semibold text-hud-ink"
    title={view.name}
  >
    {view.name}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative flex min-h-[96px] flex-1 items-end justify-center"
    title="Double-click to open the character sheet"
    ondblclick={onopensheet}
  >
    {#if view.img}
      <img src={view.img} alt="" class="absolute inset-0 h-full w-full object-cover" />
    {:else}
      <div
        class="absolute inset-0 bg-[repeating-linear-gradient(135deg,#2a2c33_0_6px,#23252b_6px_12px)]"
      ></div>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute top-[4px] left-[5px]"
      data-hud-trigger="posture"
      onmouseenter={onopen}
      onmouseleave={onclose}
      ondblclick={(event) => event.stopPropagation()}
    >
      <span
        class="flex items-center gap-[5px] rounded-hud-xs border border-transparent bg-hud-deep/80 px-[5px] py-px font-hud-mono text-[9px] font-semibold uppercase transition-colors duration-75 hover:border-white/[.18] {TONE_TEXT[
          view.posture.tone
        ]}"
        title="Posture -- hover to change"
      >
        {view.posture.label}
        <span class="text-[8px] text-hud-ink/45">▴</span>
      </span>

      {#if postureOpen}
        <!--
          The badge sits 24px inside the strip (name row, border, offset), so 30px lifts the menu
          6px clear of the strip's top edge like the top bar's panels.
        -->
        <div
          class="absolute bottom-[calc(100%+30px)] left-0 z-20 flex w-[124px] flex-col gap-px rounded-hud-lg border border-white/[.15] bg-hud-popover p-[4px] shadow-hud-popover"
        >
          {#each view.postures as option (option.id)}
            {@const isSelected = option.id === view.posture.id}
            <button
              type="button"
              class="flex cursor-pointer items-center justify-between rounded-hud-sm px-[7px] py-[3px] text-left font-hud text-[12px]/[1.2] font-semibold transition-colors duration-75 {isSelected
                ? 'bg-hud-accent text-hud-on-accent'
                : `bg-white/[.045] hover:bg-white/[.09] ${TONE_TEXT[option.tone]}`}"
              onclick={() => onposture(option.id)}
            >
              {option.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>
    <span
      class="absolute top-[4px] right-[5px] flex items-baseline gap-[4px] rounded-hud-xs bg-hud-deep/80 px-[5px] py-px"
      title="Current Move"
    >
      <span class="font-hud-mono text-[9px] font-semibold uppercase text-hud-ink/55">Move</span>
      <span class="font-hud-mono text-[11px] font-bold text-hud-ink">{view.move}</span>
    </span>
  </div>

  <div class="grid grid-cols-2 gap-[3px] px-[5px] pt-[4px] pb-[5px]">
    <div class="flex items-center gap-[4px]">
      <VitalIcon kind="hp" class="text-hud-hp" />
      <PoolField
        pool={view.hp}
        title="Hit Points -- click to edit"
        onchange={(value) => onpool("HP", value)}
      />
    </div>

    <div class="flex items-center gap-[4px]">
      <VitalIcon kind="fp" class="text-hud-fp" />
      <PoolField
        pool={view.fp}
        title="Fatigue Points -- click to edit"
        onchange={(value) => onpool("FP", value)}
      />
    </div>

    <div class="flex items-center gap-[4px]" title="Shock penalty to DX and IQ">
      <VitalIcon kind="shock" class="text-hud-accent" />
      <span class="{VITAL_BOX} {view.shock < 0 ? 'text-hud-accent' : 'text-hud-ink/72'}">
        {view.shock}
      </span>
    </div>

    <div class="flex items-center gap-[4px]" title={view.condition.title}>
      <VitalIcon
        kind="condition"
        class={idle ? "text-hud-ink/40" : TONE_TEXT[view.condition.tone]}
      />
      <span
        class="flex-1 rounded-hud-xs bg-white/[.07] px-[4px] py-px text-right font-hud-mono font-bold {idle
          ? 'text-[12px] text-hud-ink/28'
          : `text-[9px] ${TONE_TEXT[view.condition.tone]}`}"
      >
        {view.condition.label}
      </span>
    </div>
  </div>
</div>
