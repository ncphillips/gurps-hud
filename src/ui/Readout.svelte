<script lang="ts">
  import type { Snippet } from "svelte";
  import { READOUT, READOUT_TEXT, type ReadoutSize } from "./readout";

  /**
   * A static value in the vitals grid. The caller supplies the colour, because what a number means
   * -- a shock penalty, a condition, a pool at a quarter -- is the caller's knowledge, not ours.
   */
  let {
    title,
    size = "md",
    class: className = "",
    children,
  }: {
    title?: string;
    size?: ReadoutSize;
    /** The value's colour. Appended, so it cannot collide with the size utility above. */
    class?: string;
    children: Snippet;
  } = $props();
</script>

<span class="{READOUT} {READOUT_TEXT[size]} {className}" {title}>{@render children()}</span>
