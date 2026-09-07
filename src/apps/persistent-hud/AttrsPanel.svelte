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

  const ROW = "flex w-full items-baseline gap-[6px] rounded-hud-xs px-[5px] py-0";
  const VALUE = "w-[30px] flex-none text-left font-hud-mono text-[11.5px]/[1.5] font-bold";
  const LABEL = "truncate font-hud text-[11.5px]/[1.5] font-medium text-hud-ink/60";
</script>

<div class="flex gap-[6px] p-[5px]">
  {#each columns as column (column.header)}
    <div class="w-[142px] rounded-hud-sm bg-white/[.04] px-[2px] pb-[3px]">
      <div
        class="mb-[2px] border-b border-white/[.09] px-[5px] pt-[3px] pb-[2px] font-hud-mono text-[8px] font-bold tracking-[.13em] text-hud-ink/40"
      >
        {column.header}
      </div>
      {#each column.groups as group, groupIndex (groupIndex)}
        {#if groupIndex > 0}
          <div class="mx-[5px] my-[2px] h-px bg-white/[.08]"></div>
        {/if}
        {#each group as row (row.label)}
          {#if row.otf}
            <button
              type="button"
              title={t("attributes.roll", { label: row.label })}
              class="{ROW} cursor-pointer transition-colors duration-75 hover:bg-hud-accent/22"
              onclick={(event) => onroll(row.otf!, event)}
            >
              <span class="{VALUE} text-hud-accent">{row.value}</span>
              <span class={LABEL}>{row.label}</span>
            </button>
          {:else}
            <div class={ROW}>
              <span class="{VALUE} text-hud-ink/70">{row.value}</span>
              <span class={LABEL}>{row.label}</span>
            </div>
          {/if}
        {/each}
      {/each}
    </div>
  {/each}
</div>
