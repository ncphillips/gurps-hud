<script lang="ts">
  import type { Snippet } from "svelte";

  /**
   * The HUD's floating panel. Every one of them opens *upward*, because the strip is pinned to the
   * bottom-left of the screen and there is nothing below it to open into.
   *
   * `offset` is the only thing a caller has to think about: the distance from the panel's bottom
   * edge to the top of the trigger it hangs off. The strip's convention is that a panel clears the
   * strip's own top edge by 6px, so the offset is 6px plus however far the trigger sits inside the
   * strip -- 4px of padding and border for a top-bar control, 24px for the posture badge halfway
   * down the portrait. Getting it from the caller keeps that arithmetic in the one place that knows
   * where its trigger is.
   *
   * Both offsets are inline styles rather than Tailwind arbitrary values on purpose: Tailwind
   * generates classes by scanning the source for literal strings, so an interpolated `bottom-[...]`
   * would name a class that never gets built.
   */
  let {
    offset = 6,
    align = "left",
    name,
    class: className = "",
    children,
  }: {
    offset?: number;
    align?: "left" | "right";
    /** Sets `data-hud-panel`, the hook the Playwright suites wait on. */
    name?: string;
    /** The body's own layout -- width, padding, columns, scrolling -- which is the caller's. */
    class?: string;
    children: Snippet;
  } = $props();
</script>

<!--
  Floating the panel clear of its trigger leaves a gap the pointer has to cross where it is over
  neither, and the hover panels dismiss on the trigger's `mouseleave`. Crossing slowly loses the
  panel; worse, the posture badge's 30px gap spans the character-name trigger, which takes the
  hover and swaps the panel out, putting the posture menu out of reach altogether. This fills the
  gap with a transparent hover target, so the pointer never leaves the trigger's subtree.

  A sibling of the panel rather than a child: a panel that scrolls (the skills list) would clip it
  and count it as scrollable content.
-->
<div
  data-hud-popover-bridge
  aria-hidden="true"
  class="absolute inset-x-0 bottom-full z-20"
  style="height: {offset}px"
></div>

<div
  class="absolute {align === 'right'
    ? 'right-0'
    : 'left-0'} z-20 rounded-hud-lg border border-white/[.15] bg-hud-popover shadow-hud-popover {className}"
  style="bottom: calc(100% + {offset}px)"
  data-hud-panel={name}
>
  {@render children()}
</div>
