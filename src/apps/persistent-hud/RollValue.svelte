<script lang="ts">
  import type { RollableCell } from "@/gurps/hud-view";

  /**
   * The Game Aid's convention, and the one that carries the whole feel of the strip: a clickable
   * value looks like plain text and only takes on button styling on hover. Every variant therefore
   * changes colour, background and border-colour only -- never padding, width or font-size -- so a
   * row can never shift under the cursor.
   */
  let {
    cell,
    variant = "accent",
    title,
    class: className = "",
    onroll,
  }: {
    cell: RollableCell;
    variant?: "accent" | "defence" | "damage";
    title: string;
    class?: string;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const VARIANTS = {
    accent: "text-hud-accent hover:bg-hud-accent hover:text-hud-on-accent",
    defence: "text-hud-defence hover:bg-hud-defence hover:text-hud-on-accent",
    damage: "text-hud-ink/62 hover:bg-hud-ink hover:text-hud-on-accent",
  } as const;
</script>

{#if cell.otf}
  <button
    type="button"
    {title}
    class="cursor-pointer rounded-hud-sm bg-transparent transition-colors duration-75 {VARIANTS[
      variant
    ]} {className}"
    onclick={(event) => onroll(cell.otf!, event)}
  >
    {cell.text}
  </button>
{:else}
  <span class="rounded-hud-sm text-hud-ink/28 {className}">{cell.text}</span>
{/if}
