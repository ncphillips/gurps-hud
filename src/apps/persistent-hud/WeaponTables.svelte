<script lang="ts">
  import type { HudView } from "@/gurps/hud-view";
  import RollValue from "./RollValue.svelte";

  let {
    view,
    onroll,
  }: {
    view: HudView;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const HEADER =
    "flex gap-[7px] px-[9px] font-hud-mono text-[8px] font-bold tracking-[.13em] text-hud-ink/30";
  const READOUT = "font-hud-mono text-[10.5px] font-medium text-hud-ink/50";

  /**
   * Rows carry a 1px transparent border at rest so hover can only ever change its colour. Anything
   * that added a border on hover would nudge every cell in the row by a pixel.
   */
  function rowClass(equipped: boolean): string {
    const base =
      "flex items-center gap-[7px] rounded-hud-sm border px-[9px] py-[4px] transition-colors duration-75 hover:border-hud-accent/55 hover:bg-white/[.045]";
    return equipped
      ? `${base} border-hud-accent/28 bg-hud-accent/9`
      : `${base} border-transparent bg-transparent`;
  }
</script>

<div class="flex flex-1 flex-col gap-[4px] px-[12px] pb-[9px]">
  {#if view.melee.length > 0}
    <div class={HEADER}>
      <span class="flex-1">MELEE</span>
      <span class="w-[38px] text-center">REACH</span>
      <span class="w-[30px] text-center">LVL</span>
      <span class="w-[62px] px-[4px]">DAMAGE</span>
      <span class="w-[30px] text-center">BLOCK</span>
      <span class="w-[30px] text-center">PARRY</span>
    </div>

    {#each view.melee as row (row.key)}
      <div class={rowClass(row.equipped)} title={row.equipped ? "Readied" : undefined}>
        <span class="flex-1 truncate font-hud text-[13px] font-semibold text-hud-ink"
          >{row.name}</span
        >
        <span class="w-[38px] text-center {READOUT}">{row.reach}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title="Roll against this level"
          class="w-[30px] py-px text-center font-hud-mono text-[14px] font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title="Roll damage"
          class="w-[62px] px-[4px] py-px font-hud-mono text-[10.5px] font-medium"
          {onroll}
        />
        <RollValue
          cell={row.block}
          variant="defence"
          title="Roll this defence"
          class="w-[30px] py-px text-center font-hud-mono text-[14px] font-bold"
          {onroll}
        />
        <RollValue
          cell={row.parry}
          variant="defence"
          title="Roll this defence"
          class="w-[30px] py-px text-center font-hud-mono text-[14px] font-bold"
          {onroll}
        />
      </div>
    {/each}
  {/if}

  {#if view.ranged.length > 0}
    <div class="{HEADER} pt-[7px]">
      <span class="flex-1">RANGED</span>
      <span class="w-[38px] text-center">ACC</span>
      <span class="w-[30px] text-center">LVL</span>
      <span class="w-[62px] px-[4px]">DAMAGE</span>
      <span class="w-[30px] text-center">RANGE</span>
      <span class="w-[30px] text-center">ROF</span>
    </div>

    {#each view.ranged as row (row.key)}
      <div class={rowClass(row.equipped)} title={row.equipped ? "Readied" : undefined}>
        <span class="flex-1 truncate font-hud text-[13px] font-semibold text-hud-ink"
          >{row.name}</span
        >
        <span class="w-[38px] text-center {READOUT}">{row.acc}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title="Roll against this level"
          class="w-[30px] py-px text-center font-hud-mono text-[14px] font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title="Roll damage"
          class="w-[62px] px-[4px] py-px font-hud-mono text-[10.5px] font-medium"
          {onroll}
        />
        <span class="w-[30px] text-center {READOUT}">{row.range}</span>
        <span class="w-[30px] text-center {READOUT}">{row.rof}</span>
      </div>
    {/each}
  {/if}

  {#if view.melee.length === 0 && view.ranged.length === 0}
    <div class="px-[9px] py-[4px] font-hud text-[12px] font-medium text-hud-ink/30">
      No attacks on this actor.
    </div>
  {/if}
</div>
