<script lang="ts">
  import { HUD_MANEUVERS } from "@/gurps/maneuvers";
  import type { HudManeuver } from "@/gurps/maneuvers";

  let {
    maneuver,
    enabled,
    open,
    onopen,
    onclose,
    onselect,
  }: {
    /** What the actor is actually performing, or `null` when it has no maneuver. */
    maneuver: HudManeuver | null;
    /** False when the Game Aid would refuse the change -- the actor is not in the active combat. */
    enabled: boolean;
    open: boolean;
    onopen: () => void;
    onclose: () => void;
    onselect: (id: string) => void;
  } = $props();

  const hint = $derived(enabled ? (maneuver?.hint ?? "") : "not in combat");
</script>

<div class="flex items-center gap-[10px] px-[12px] pt-[9px] pb-[8px]">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="relative" onmouseenter={enabled ? onopen : undefined} onmouseleave={onclose}>
    <div
      class="flex items-center gap-[9px] rounded-hud-md px-[11px] py-[5px] {enabled
        ? 'bg-hud-accent'
        : 'bg-white/[.06]'}"
      title={enabled ? "Maneuver" : "Maneuvers can only be set for a token in the active combat"}
    >
      <span
        class="font-hud-mono text-[8px] font-bold tracking-[.14em] {enabled
          ? 'text-hud-on-accent/60'
          : 'text-hud-ink/32'}"
      >
        MANEUVER
      </span>
      <span
        class="font-hud text-[15px]/none font-bold tracking-[.02em] {enabled
          ? 'text-hud-on-accent'
          : 'text-hud-ink/35'}"
      >
        {maneuver?.name ?? "—"}
      </span>
      {#if enabled}
        <span class="font-hud-mono text-[9px] font-bold text-hud-on-accent/55">▴</span>
      {/if}
    </div>

    {#if open && enabled}
      <div
        class="absolute bottom-[calc(100%+5px)] left-0 z-20 grid w-[464px] grid-cols-2 gap-[2px] rounded-hud-lg border border-white/[.15] bg-hud-popover p-[5px] shadow-hud-popover"
      >
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

  <span class="font-hud text-[12px] font-medium text-hud-ink/50">{hint}</span>
</div>
