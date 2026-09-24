<script lang="ts">
  import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom";
  import type { Snippet } from "svelte";

  /**
   * The HUD's floating panel. It hangs off its trigger -- the element it is rendered inside -- and
   * opens just above it, or just under it when the reader has moved the strip too near the top of
   * the window for the panel to fit, sliding sideways to stay on screen.
   *
   * Close to the trigger even where that covers the rest of the strip -- the posture menu lies over
   * the name row. Held clear of the strip instead, the bridge across the gap sat over the name row's
   * buttons, which showed through it and could not be pressed.
   *
   * It stays inside its trigger in the DOM rather than being portalled to the body, because the
   * hover panels dismiss on the trigger's `mouseleave`, and the strip's `zoom` must reach it.
   */
  let {
    align = "left",
    name,
    class: className = "",
    children,
  }: {
    align?: "left" | "right";
    /** Sets `data-hud-panel`, the hook the Playwright suites wait on. */
    name?: string;
    /** The body's own layout -- width, padding, columns, scrolling -- which is the caller's. */
    class?: string;
    children: Snippet;
  } = $props();

  /** Between the panel and its trigger, and between the panel and the window's edge. */
  const GAP = 6;

  const heightOf = (element: HTMLElement) => parseFloat(getComputedStyle(element).height);

  let panel = $state<HTMLElement | null>(null);
  let bridge = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!panel || !bridge) return;
    const floating = panel;
    const gap = bridge;
    const trigger = floating.parentElement!;
    // A caller's cap on a panel that scrolls, which a short window may lower but never raise.
    const cap = parseFloat(getComputedStyle(floating).maxHeight);

    const place = () =>
      computePosition(trigger, floating, {
        placement: align === "right" ? "top-end" : "top-start",
        middleware: [
          offset(GAP),
          flip({ padding: GAP }),
          shift({ padding: GAP }),
          size({
            padding: GAP,
            apply({ availableHeight }) {
              if (Number.isFinite(cap)) {
                floating.style.maxHeight = `${Math.min(cap, availableHeight)}px`;
              }
            },
          }),
        ],
      }).then(({ x, y, placement }) => {
        floating.style.left = `${x}px`;
        floating.style.top = `${y}px`;

        // Both in the trigger's own box, which is the panel's offset parent. Computed heights, since
        // `offsetHeight` rounds and a fractional panel would leave a 1px seam.
        const above = placement.startsWith("top");
        const from = above ? y + heightOf(floating) : heightOf(trigger);
        const to = above ? 0 : y;
        gap.style.top = `${from}px`;
        gap.style.height = `${Math.max(0, to - from)}px`;
      });

    return autoUpdate(trigger, floating, place);
  });
</script>

<!--
  Floating the panel clear of its trigger leaves a gap the pointer has to cross where it is over
  neither, and the hover panels dismiss on the trigger's `mouseleave`. Crossing slowly loses the
  panel; worse, the posture badge's gap spans the character-name trigger, which takes the hover and
  swaps the panel out, putting the posture menu out of reach altogether. This fills the gap with a
  transparent hover target, so the pointer never leaves the trigger's subtree.

  A sibling of the panel rather than a child: a panel that scrolls (the skills list) would clip it
  and count it as scrollable content.
-->
<div
  bind:this={bridge}
  data-hud-popover-bridge
  aria-hidden="true"
  class="hud:absolute hud:inset-x-0 hud:z-20"
></div>

<div
  bind:this={panel}
  data-hud-popover
  class="hud:absolute hud:top-0 hud:left-0 hud:z-20 hud:rounded-hud-lg hud:border hud:border-hud-veil/[.15] hud:bg-hud-popover hud:shadow-hud-popover {className}"
  data-hud-panel={name}
>
  {@render children()}
</div>
