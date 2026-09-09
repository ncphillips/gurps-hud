<script lang="ts">
  import type { HudView } from "@/gurps/hud-view";
  import { t } from "@/i18n";
  import RollValue from "./RollValue.svelte";

  let {
    view,
    enabled,
    onroll,
  }: {
    view: HudView;
    /** False with nothing selected, which is a different emptiness from an actor who carries nothing. */
    enabled: boolean;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const HEADER =
    "flex gap-[7px] px-[7px] pb-px font-hud-mono text-[8px]/[1.4] font-bold tracking-[.13em] text-hud-ink/30";
  const READOUT = "font-hud-mono text-[10.5px] font-medium text-hud-ink/50";

  /**
   * Rows carry a 1px transparent border at rest so hover can only ever change its colour. Anything
   * that added a border on hover would nudge every cell in the row by a pixel.
   */
  function rowClass(equipped: boolean): string {
    const base =
      "flex items-center gap-[7px] rounded-hud-sm border px-[7px] py-0 transition-colors duration-75 hover:border-hud-accent/55 hover:bg-white/[.045]";
    return equipped
      ? `${base} border-hud-accent/28 bg-hud-accent/9`
      : `${base} border-transparent bg-transparent`;
  }
</script>

<!--
  The strip has a maximum height (see --spacing-hud-max in gurps-hud.css); this is the one region
  allowed to scroll when an actor carries more attacks than fit.
-->
<div
  class="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-[3px] pb-[3px] [scrollbar-color:rgb(255_255_255/.18)_transparent] [scrollbar-width:thin]"
>
  {#if view.melee.length > 0}
    <div class={HEADER}>
      <span class="flex-1">{t("weapons.melee")}</span>
      <span class="w-[38px] text-center">{t("weapons.reach")}</span>
      <span class="w-[30px] text-center">{t("weapons.level")}</span>
      <span class="w-[62px] px-[4px]">{t("weapons.damage")}</span>
      <span class="w-[30px] text-center">{t("weapons.block")}</span>
      <span class="w-[30px] text-center">{t("weapons.parry")}</span>
    </div>

    {#each view.melee as row (row.key)}
      <div class={rowClass(row.equipped)} title={row.equipped ? t("weapons.readied") : undefined}>
        <span class="flex-1 truncate font-hud text-[12.5px]/[1.35] font-semibold text-hud-ink"
          >{row.name}</span
        >
        <span class="w-[38px] text-center {READOUT}">{row.reach}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title={t("weapons.rollLevel")}
          class="w-[30px] text-center font-hud-mono text-[13px]/[1.35] font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title={t("weapons.rollDamage")}
          class="w-[62px] px-[4px] font-hud-mono text-[10.5px]/[1.35] font-medium"
          {onroll}
        />
        <RollValue
          cell={row.block}
          variant="defence"
          title={t("weapons.rollDefence")}
          class="w-[30px] text-center font-hud-mono text-[13px]/[1.35] font-bold"
          {onroll}
        />
        <RollValue
          cell={row.parry}
          variant="defence"
          title={t("weapons.rollDefence")}
          class="w-[30px] text-center font-hud-mono text-[13px]/[1.35] font-bold"
          {onroll}
        />
      </div>
    {/each}
  {/if}

  {#if view.ranged.length > 0}
    <div class="{HEADER} pt-[5px]">
      <span class="flex-1">{t("weapons.ranged")}</span>
      <span class="w-[38px] text-center">{t("weapons.acc")}</span>
      <span class="w-[30px] text-center">{t("weapons.level")}</span>
      <span class="w-[62px] px-[4px]">{t("weapons.damage")}</span>
      <span class="w-[30px] text-center">{t("weapons.range")}</span>
      <span class="w-[30px] text-center">{t("weapons.rof")}</span>
    </div>

    {#each view.ranged as row (row.key)}
      <div class={rowClass(row.equipped)} title={row.equipped ? t("weapons.readied") : undefined}>
        <span class="flex-1 truncate font-hud text-[12.5px]/[1.35] font-semibold text-hud-ink"
          >{row.name}</span
        >
        <span class="w-[38px] text-center {READOUT}">{row.acc}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title={t("weapons.rollLevel")}
          class="w-[30px] text-center font-hud-mono text-[13px]/[1.35] font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title={t("weapons.rollDamage")}
          class="w-[62px] px-[4px] font-hud-mono text-[10.5px]/[1.35] font-medium"
          {onroll}
        />
        <span class="w-[30px] text-center {READOUT}">{row.range}</span>
        <span class="w-[30px] text-center {READOUT}">{row.rof}</span>
      </div>
    {/each}
  {/if}

  {#if view.melee.length === 0 && view.ranged.length === 0}
    <div class="px-[7px] py-[2px] font-hud text-[12px] font-medium text-hud-ink/30">
      {enabled ? t("weapons.empty") : t("weapons.noActor")}
    </div>
  {/if}
</div>
