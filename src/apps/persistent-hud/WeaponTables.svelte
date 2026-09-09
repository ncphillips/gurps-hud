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
    "hud:flex hud:gap-[7px] hud:px-[7px] hud:pb-px hud:font-hud-mono hud:text-[8px]/[1.4] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/30";
  const READOUT = "hud:font-hud-mono hud:text-[10.5px] hud:font-medium hud:text-hud-ink/50";

  /**
   * Rows carry a 1px transparent border at rest so hover can only ever change its colour. Anything
   * that added a border on hover would nudge every cell in the row by a pixel.
   */
  function rowClass(equipped: boolean): string {
    const base =
      "hud:flex hud:items-center hud:gap-[7px] hud:rounded-hud-sm hud:border hud:px-[7px] hud:py-0 hud:transition-colors hud:duration-75 hud:hover:border-hud-accent/55 hud:hover:bg-white/[.045]";
    return equipped
      ? `${base} hud:border-hud-accent/28 hud:bg-hud-accent/9`
      : `${base} hud:border-transparent hud:bg-transparent`;
  }
</script>

<!--
  The strip has a maximum height (see --spacing-hud-max in gurps-hud.css); this is the one region
  allowed to scroll when an actor carries more attacks than fit.
-->
<div
  class="hud:flex hud:min-h-0 hud:flex-1 hud:flex-col hud:gap-px hud:overflow-y-auto hud:px-[3px] hud:pb-[3px] hud:[scrollbar-color:rgb(255_255_255/.18)_transparent] hud:[scrollbar-width:thin]"
>
  {#if view.melee.length > 0}
    <div class={HEADER}>
      <span class="hud:flex-1">{t("weapons.melee")}</span>
      <span class="hud:w-[38px] hud:text-center">{t("weapons.reach")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.level")}</span>
      <span class="hud:w-[62px] hud:px-[4px]">{t("weapons.damage")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.block")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.parry")}</span>
    </div>

    {#each view.melee as row (row.key)}
      <div class={rowClass(row.equipped)} title={row.equipped ? t("weapons.readied") : undefined}>
        <span
          class="hud:flex-1 hud:truncate hud:font-hud hud:text-[12.5px]/[1.35] hud:font-semibold hud:text-hud-ink"
          >{row.name}</span
        >
        <span class="hud:w-[38px] hud:text-center {READOUT}">{row.reach}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title={t("weapons.rollLevel")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title={t("weapons.rollDamage")}
          class="hud:w-[62px] hud:px-[4px] hud:font-hud-mono hud:text-[10.5px]/[1.35] hud:font-medium"
          {onroll}
        />
        <RollValue
          cell={row.block}
          variant="defence"
          title={t("weapons.rollDefence")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
        <RollValue
          cell={row.parry}
          variant="defence"
          title={t("weapons.rollDefence")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
      </div>
    {/each}
  {/if}

  {#if view.ranged.length > 0}
    <div class="{HEADER} hud:pt-[5px]">
      <span class="hud:flex-1">{t("weapons.ranged")}</span>
      <span class="hud:w-[38px] hud:text-center">{t("weapons.acc")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.level")}</span>
      <span class="hud:w-[62px] hud:px-[4px]">{t("weapons.damage")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.range")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.rof")}</span>
    </div>

    {#each view.ranged as row (row.key)}
      <div class={rowClass(row.equipped)} title={row.equipped ? t("weapons.readied") : undefined}>
        <span
          class="hud:flex-1 hud:truncate hud:font-hud hud:text-[12.5px]/[1.35] hud:font-semibold hud:text-hud-ink"
          >{row.name}</span
        >
        <span class="hud:w-[38px] hud:text-center {READOUT}">{row.acc}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title={t("weapons.rollLevel")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title={t("weapons.rollDamage")}
          class="hud:w-[62px] hud:px-[4px] hud:font-hud-mono hud:text-[10.5px]/[1.35] hud:font-medium"
          {onroll}
        />
        <span class="hud:w-[30px] hud:text-center {READOUT}">{row.range}</span>
        <span class="hud:w-[30px] hud:text-center {READOUT}">{row.rof}</span>
      </div>
    {/each}
  {/if}

  {#if view.melee.length === 0 && view.ranged.length === 0}
    <div
      class="hud:px-[7px] hud:py-[2px] hud:font-hud hud:text-[12px] hud:font-medium hud:text-hud-ink/30"
    >
      {enabled ? t("weapons.empty") : t("weapons.noActor")}
    </div>
  {/if}
</div>
