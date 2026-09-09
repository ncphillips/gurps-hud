<script lang="ts">
  /**
   * Inline glyphs for the four vitals cells. Inline rather than Font Awesome so the harness, which
   * has no Foundry stylesheet, renders the same as the real thing.
   */
  let {
    kind,
    class: className = "",
  }: { kind: "hp" | "fp" | "shock" | "condition"; class?: string } = $props();
</script>

<svg
  viewBox="0 0 24 24"
  class="hud:h-[11px] hud:w-[11px] hud:flex-none {className}"
  aria-hidden="true"
>
  {#if kind === "hp"}
    <!-- heart -->
    <path
      fill="currentColor"
      d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 2.7 4.5 6.3 4.5c2 0 3.6 1.1 4.6 2.7.9-1.6 2.6-2.7 4.6-2.7 3.6 0 5.4 3.8 3.9 7.2C19.5 16.4 12 21 12 21z"
    />
  {:else if kind === "fp"}
    <!-- lungs -->
    <path
      fill="currentColor"
      d="M11 3h2v7.2l2.8-1.8V3.5c0-.3.2-.5.5-.5s.5.2.5.5v5.5l-3.8 2.4v1.4l4.2-2.6c2.4 1.2 4.3 5 4.3 8.7 0 1.7-1 2.6-2.4 2.6-2.6 0-5.4-2-6.1-5.5V3zm-2 0v13.5c-.7 3.5-3.5 5.5-6.1 5.5C1.5 22 .5 21.1.5 19.4c0-3.7 1.9-7.5 4.3-8.7l4.2 2.6v-1.4L5.2 9.5V4c0-.3.2-.5.5-.5s.5.2.5.5v4.9L9 10.2V3z"
    />
  {:else if kind === "shock"}
    <!-- bolt -->
    <path fill="currentColor" d="M13.5 2 4 14h6.5L9 22l10.5-12.5H13z" />
  {:else}
    <!-- triangle with exclamation -->
    <path
      fill="currentColor"
      d="M12 2.5 23 21.5H1zM11 9v6h2V9zm0 7.5v2h2v-2z"
      fill-rule="evenodd"
    />
  {/if}
</svg>
