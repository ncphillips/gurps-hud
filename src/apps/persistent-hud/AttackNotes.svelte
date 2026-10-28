<script lang="ts">
  import { attackNoteSegments } from "@/gurps/game-aid";

  /**
   * An attack's VTT notes under its name, as the character sheet shows them -- chiefly so the `[OtF]`
   * buttons people wire sounds and animations to are a click away mid-fight.
   */
  let {
    notes,
    onroll,
  }: {
    notes: string;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const segments = $derived(attackNoteSegments(notes));
</script>

{#if segments.length > 0}
  <span
    data-hud-attack-notes
    class="hud:block hud:truncate hud:font-hud hud:text-[10.5px]/[1.35] hud:font-medium hud:text-hud-faint"
  >
    {#each segments as segment, index (index)}
      {#if segment.otf}
        <button
          type="button"
          class="hud:cursor-pointer hud:rounded-hud-sm hud:border hud:border-hud-veil/[.18] hud:bg-hud-veil/[.05] hud:px-[4px] hud:text-hud-ink/70 hud:transition-colors hud:duration-75 hud:hover:border-hud-accent hud:hover:bg-hud-accent hud:hover:text-hud-on-accent"
          onclick={(event) => onroll(segment.otf!, event)}>{segment.text}</button
        >
      {:else}{segment.text}{/if}
    {/each}
  </span>
{/if}
