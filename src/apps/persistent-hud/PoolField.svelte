<script lang="ts">
  import type { PoolVital, Tone } from "@/gurps/hud-view";
  import { parsePoolEdit } from "@/gurps/pool-edit";
  import { tick } from "svelte";

  /**
   * An HP or FP readout that turns into a text box on click. Only the current value is editable;
   * the maximum is the character's and belongs on the sheet. Enter or blur commits, Escape cancels,
   * and a signed entry like "-3" adjusts rather than replaces.
   */
  let {
    pool,
    title,
    onchange,
  }: {
    pool: PoolVital;
    title: string;
    onchange: (value: number) => void;
  } = $props();

  const TEXT: Record<Tone, string> = {
    ok: "text-hud-ink",
    warn: "text-hud-accent",
    danger: "text-hud-hp",
  };

  let editing = $state(false);
  let draft = $state("");
  let input = $state<HTMLInputElement | null>(null);

  async function begin(): Promise<void> {
    draft = pool.value;
    editing = true;
    await tick();
    input?.select();
  }

  function commit(): void {
    if (!editing) return;
    editing = false;
    const next = parsePoolEdit(draft, Number(pool.value));
    if (next !== null) onchange(next);
  }

  function cancel(): void {
    editing = false;
  }

  function keydown(event: KeyboardEvent): void {
    if (event.key === "Enter") commit();
    else if (event.key === "Escape") cancel();
    else return;
    event.preventDefault();
  }

  /* The box keeps one geometry in both states so toggling never moves its neighbours. */
  const BOX =
    "flex-1 rounded-hud-xs bg-white/[.07] px-[4px] py-px text-right font-hud-mono text-[12px]/[1.35] font-bold";
</script>

{#if editing}
  <input
    bind:this={input}
    bind:value={draft}
    type="text"
    inputmode="numeric"
    class="{BOX} w-0 min-w-0 border-0 text-hud-ink outline-none"
    onblur={commit}
    onkeydown={keydown}
  />
{:else}
  <button
    type="button"
    {title}
    class="{BOX} cursor-text transition-colors duration-75 hover:bg-white/[.14] {TEXT[pool.tone]}"
    onclick={begin}
  >
    {pool.value}<span class="text-[9.5px] text-hud-ink/45">/{pool.max}</span>
  </button>
{/if}
