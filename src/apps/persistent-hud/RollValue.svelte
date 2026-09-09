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
    accent: "hud:text-hud-accent hud:hover:bg-hud-accent hud:hover:text-hud-on-accent",
    defence: "hud:text-hud-defence hud:hover:bg-hud-defence hud:hover:text-hud-on-accent",
    damage: "hud:text-hud-ink/62 hud:hover:bg-hud-ink hud:hover:text-hud-on-accent",
  } as const;
</script>

{#if cell.otf}
  <button
    type="button"
    {title}
    class="hud:cursor-pointer hud:rounded-hud-sm hud:bg-transparent hud:transition-colors hud:duration-75 {VARIANTS[
      variant
    ]} {className}"
    onclick={(event) => onroll(cell.otf!, event)}
  >
    {cell.text}
  </button>
{:else}
  <span class="hud:rounded-hud-sm hud:text-hud-ink/28 {className}">{cell.text}</span>
{/if}
