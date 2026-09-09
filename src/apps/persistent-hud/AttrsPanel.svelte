<script lang="ts">
  import type { AttrColumn } from "@/gurps/hud-view";
  import { t } from "@/i18n";

  /**
   * Laid out like the character sheet's attribute boxes: two side-by-side columns, value first in a
   * fixed left-aligned column, label after, hairlines between groups, rows at text height.
   */
  let {
    basic,
    secondary,
    onroll,
  }: {
    basic: AttrColumn;
    secondary: AttrColumn;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const columns = $derived([basic, secondary]);

  const ROW =
    "hud:flex hud:w-full hud:items-baseline hud:gap-[6px] hud:rounded-hud-xs hud:px-[5px] hud:py-0";
  const VALUE =
    "hud:w-[30px] hud:flex-none hud:text-left hud:font-hud-mono hud:text-[11.5px]/[1.5] hud:font-bold";
  const LABEL =
    "hud:truncate hud:font-hud hud:text-[11.5px]/[1.5] hud:font-medium hud:text-hud-ink/60";
</script>

<div class="hud:flex hud:gap-[6px] hud:p-[5px]">
  {#each columns as column (column.header)}
    <div class="hud:w-[142px] hud:rounded-hud-sm hud:bg-white/[.04] hud:px-[2px] hud:pb-[3px]">
      <div
        class="hud:mb-[2px] hud:border-b hud:border-white/[.09] hud:px-[5px] hud:pt-[3px] hud:pb-[2px] hud:font-hud-mono hud:text-[8px] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/40"
      >
        {column.header}
      </div>
      {#each column.groups as group, groupIndex (groupIndex)}
        {#if groupIndex > 0}
          <div class="hud:mx-[5px] hud:my-[2px] hud:h-px hud:bg-white/[.08]"></div>
        {/if}
        {#each group as row (row.label)}
          {#if row.otf}
            <button
              type="button"
              title={t("attributes.roll", { label: row.label })}
              class="{ROW} hud:cursor-pointer hud:transition-colors hud:duration-75 hud:hover:bg-hud-accent/22"
              onclick={(event) => onroll(row.otf!, event)}
            >
              <span class="{VALUE} hud:text-hud-accent">{row.value}</span>
              <span class={LABEL}>{row.label}</span>
            </button>
          {:else}
            <div class={ROW}>
              <span class="{VALUE} hud:text-hud-ink/70">{row.value}</span>
              <span class={LABEL}>{row.label}</span>
            </div>
          {/if}
        {/each}
      {/each}
    </div>
  {/each}
</div>
