<script lang="ts">
  import type { AttrColumn } from "@/gurps/hud-view";

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
</script>

<div
  class="absolute bottom-[calc(100%+5px)] left-0 z-20 grid w-[368px] grid-cols-2 gap-[10px] rounded-hud-lg border border-white/[.15] bg-hud-popover p-[7px] shadow-hud-popover"
>
  {#each columns as column (column.header)}
    <div>
      <div
        class="mb-[3px] border-b border-white/[.09] px-[5px] pt-[2px] pb-[3px] font-hud-mono text-[8.5px] font-bold tracking-[.13em] text-hud-ink/40"
      >
        {column.header}
      </div>
      {#each column.groups as group, groupIndex (groupIndex)}
        {#if groupIndex > 0}
          <div class="mx-[5px] my-[4px] h-px bg-white/[.08]"></div>
        {/if}
        {#each group as row (row.label)}
          {#if row.otf}
            <button
              type="button"
              title="Roll against {row.label}"
              class="flex w-full cursor-pointer items-baseline gap-[7px] rounded-hud-xs px-[5px] py-px transition-colors duration-75 hover:bg-hud-accent/22"
              onclick={(event) => onroll(row.otf!, event)}
            >
              <span
                class="w-[34px] flex-none text-right font-hud-mono text-[12.5px] font-bold text-hud-ink"
              >
                {row.value}
              </span>
              <span class="font-hud text-[12px] font-medium text-hud-ink/60">{row.label}</span>
            </button>
          {:else}
            <div
              class="flex items-baseline gap-[7px] rounded-hud-xs px-[5px] py-px transition-colors duration-75 hover:bg-white/[.07]"
            >
              <span
                class="w-[34px] flex-none text-right font-hud-mono text-[12.5px] font-bold text-hud-ink/60"
              >
                {row.value}
              </span>
              <span class="font-hud text-[12px] font-medium text-hud-ink/60">{row.label}</span>
            </div>
          {/if}
        {/each}
      {/each}
    </div>
  {/each}

  <div class="col-span-full font-hud text-[10px] font-medium text-hud-ink/30">
    Click any value to roll against it.
  </div>
</div>
