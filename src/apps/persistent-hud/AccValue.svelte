<script lang="ts">
  import type { AccCell } from "@/gurps/hud-view";
  import { t } from "@/i18n";

  /**
   * RollValue's look for the one readout that feeds the bucket instead of rolling. It stays as quiet
   * as the readouts beside it until hovered, as the Game Aid's own sheet does with Acc.
   */
  let {
    acc,
    class: className = "",
    onacc,
  }: {
    acc: AccCell;
    class?: string;
    onacc: (acc: AccCell) => void;
  } = $props();
</script>

{#if acc.mod !== null}
  <button
    type="button"
    title={t("weapons.addAcc")}
    class="hud:cursor-pointer hud:rounded-hud-sm hud:bg-transparent hud:transition-colors hud:duration-75 hud:hover:bg-hud-ink hud:hover:text-hud-on-accent {className}"
    onclick={() => onacc(acc)}
  >
    {acc.text}
  </button>
{:else}
  <span class={className}>{acc.text}</span>
{/if}
