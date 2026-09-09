<script lang="ts">
  import type { PoolVital, Tone } from "@/gurps/hud-view";
  import { parsePoolEdit } from "@/gurps/pool-edit";
  import { READOUT, READOUT_TEXT } from "@/ui/readout";
  import { tick } from "svelte";

  /**
   * An HP or FP readout that turns into a text box on click. Only the current value is editable;
   * the maximum is the character's and belongs on the sheet. Enter or blur commits, Escape cancels,
   * a signed entry like "-3" adjusts rather than replaces, and the arrow keys step by one.
   */
  let {
    pool,
    enabled,
    title,
    onchange,
  }: {
    pool: PoolVital;
    /** False with no actor selected: the box reads as blank and cannot be opened for editing. */
    enabled: boolean;
    title: string;
    onchange: (value: number) => void;
  } = $props();

  const TEXT: Record<Tone, string> = {
    ok: "hud:text-hud-ink",
    warn: "hud:text-hud-accent",
    danger: "hud:text-hud-hp",
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

  const STEP: Record<string, number> = { ArrowUp: 1, ArrowDown: -1 };

  /** While editing, the arrows nudge the draft; on the idle box they change the actor directly. */
  function keydown(event: KeyboardEvent): void {
    const step = STEP[event.key];
    if (event.key === "Enter") commit();
    else if (event.key === "Escape") cancel();
    else if (step) {
      const base = /^[+-]?\d+$/.test(draft.trim()) ? Number(draft) : Number(pool.value);
      draft = String(base + step);
    } else return;
    event.preventDefault();
  }

  function idleKeydown(event: KeyboardEvent): void {
    const step = STEP[event.key];
    if (!step) return;
    event.preventDefault();
    onchange(Number(pool.value) + step);
  }

  /* The box keeps one geometry in both states so toggling never moves its neighbours. */
  const BOX = `${READOUT} ${READOUT_TEXT.md}`;
</script>

{#if !enabled}
  <span class="{BOX} hud:text-hud-ink/28"
    >{pool.value}<span class="hud:text-[9.5px]">/{pool.max}</span></span
  >
{:else if editing}
  <input
    bind:this={input}
    bind:value={draft}
    type="text"
    inputmode="numeric"
    class="{BOX} hud:w-0 hud:min-w-0 hud:border-0 hud:text-hud-ink hud:outline-none"
    onblur={commit}
    onkeydown={keydown}
  />
{:else}
  <button
    type="button"
    {title}
    class="{BOX} hud:cursor-text hud:transition-colors hud:duration-75 hud:hover:bg-white/[.14] {TEXT[
      pool.tone
    ]}"
    onclick={begin}
    onkeydown={idleKeydown}
  >
    {pool.value}<span class="hud:text-[9.5px] hud:text-hud-ink/45">/{pool.max}</span>
  </button>
{/if}
