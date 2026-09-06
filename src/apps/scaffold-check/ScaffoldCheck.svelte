<script lang="ts">
  let { version }: { version: string } = $props();

  let clicks = $state(0);
</script>

<div class="flex flex-col gap-2 p-3 text-sm text-gray-200">
  <p class="font-semibold">GURPS HUD v{version}</p>
  <p class="text-gray-400">Svelte 5 + Tailwind 4 are wired into ApplicationV2.</p>
  <button
    class="self-start rounded bg-white/10 px-2 py-1 hover:bg-white/20"
    onclick={() => clicks++}
  >
    Reactivity check: {clicks}
  </button>
</div>
