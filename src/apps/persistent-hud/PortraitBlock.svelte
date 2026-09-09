<script lang="ts">
  import type { HudView, Tone } from "@/gurps/hud-view";
  import type { ActorChoice } from "@/gurps/actor-choices";
  import type { Pool } from "@/gurps/game-aid";
  import type { GurpsActorLike } from "@/gurps/system-types";
  import { t } from "@/i18n";
  import Popover from "@/ui/Popover.svelte";
  import Readout from "@/ui/Readout.svelte";
  import PoolField from "./PoolField.svelte";
  import VitalIcon from "./VitalIcon.svelte";
  import type { Panel } from "./panels";

  let {
    view,
    enabled,
    actor,
    onpool,
    onopensheet,
    locked,
    ontogglelock,
    choices,
    onselectactor,
    openPanel,
    onposture,
    onopen,
    onclose,
  }: {
    view: HudView;
    /** False with nothing selected: the block still renders, but nothing in it acts on an actor. */
    enabled: boolean;
    /** The actor behind `view`, so the switcher can mark the current choice; null when there is none. */
    actor: GurpsActorLike | null;
    onpool: (pool: Pool, value: number) => void;
    onopensheet: () => void;
    /** Whether the strip is pinned to this actor, ignoring token selection. */
    locked: boolean;
    ontogglelock: () => void;
    /** The actors the user could switch to; the name only opens a menu when there is more than one. */
    choices: ActorChoice[];
    onselectactor: (choice: ActorChoice) => void;
    openPanel: Panel | null;
    onposture: (id: string) => void;
    onopen: (panel: Panel) => void;
    onclose: () => void;
  } = $props();

  /*
   * Switching is the one thing the block still offers with no actor -- the name reads "Select Actor"
   * and the menu is how that gets done -- so what counts as worth opening is one more choice than
   * the one already shown, which with nothing selected is any choice at all.
   */
  const switchable = $derived(choices.length > (enabled ? 1 : 0));
  const isCurrent = (choice: ActorChoice) => choice.actor === actor;

  const TONE_TEXT: Record<Tone, string> = {
    ok: "hud:text-hud-ok",
    warn: "hud:text-hud-accent",
    danger: "hud:text-hud-hp",
  };

  const idle = $derived(view.condition.label === "—");

  /** With no actor the vitals icons stay in place, dimmed, so the cells read as blank not zeroed. */
  const ICON = $derived({
    hp: enabled ? "hud:text-hud-hp" : "hud:text-hud-hp/40",
    fp: enabled ? "hud:text-hud-fp" : "hud:text-hud-fp/40",
    shock: enabled ? "hud:text-hud-accent" : "hud:text-hud-accent/40",
  });
</script>

<div
  class="hud:flex hud:w-[143px] hud:flex-none hud:flex-col hud:rounded-l-hud hud:border-r hud:border-white/[.08] hud:bg-hud-deep"
>
  <div class="hud:flex hud:items-center hud:gap-[2px] hud:pr-[7px] hud:pl-[3px] hud:py-[2px]">
    <button
      type="button"
      class="hud:flex hud:h-[14px] hud:w-[14px] hud:flex-none hud:items-center hud:justify-center hud:rounded-hud-xs hud:border hud:border-transparent hud:transition-colors hud:duration-75 {enabled
        ? 'hud:cursor-pointer hud:hover:border-white/[.18] hud:hover:bg-white/[.08]'
        : 'hud:text-hud-ink/20'} {locked
        ? 'hud:text-hud-accent'
        : enabled
          ? 'hud:text-hud-ink/35 hud:hover:text-hud-ink/70'
          : ''}"
      title={locked ? t("portrait.lock.locked") : t("portrait.lock.unlocked")}
      aria-pressed={locked}
      disabled={!enabled}
      onclick={ontogglelock}
    >
      <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor" aria-hidden="true">
        <rect x="2" y="5.5" width="8" height="6" rx="1" />
        {#if locked}
          <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5h-1.2V4a.8.8 0 0 0-1.6 0v1.5Z" />
        {:else}
          <path d="M4 5.5V3.5a2 2 0 0 1 4 0V4H6.8v-.5a.8.8 0 0 0-1.6 0v2Z" />
        {/if}
      </svg>
    </button>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="hud:relative hud:min-w-0 hud:flex-1"
      data-hud-trigger="actor"
      onmouseenter={switchable ? () => onopen("actor") : undefined}
      onmouseleave={switchable ? onclose : undefined}
    >
      <div
        class="hud:flex hud:items-center hud:justify-center hud:gap-[4px] hud:rounded-hud-xs hud:border hud:border-transparent hud:px-[3px] hud:font-hud hud:text-[12.5px]/[1.25] hud:font-semibold hud:text-hud-ink hud:transition-colors hud:duration-75 {switchable
          ? 'hud:hover:border-white/[.18] hud:hover:bg-white/[.06]'
          : ''}"
        title={!enabled
          ? t("portrait.selectCharacter")
          : switchable
            ? t("portrait.switchCharacter", { name: view.name })
            : view.name}
      >
        <span class="hud:truncate">{view.name}</span>
        {#if switchable}
          <span class="hud:flex-none hud:text-[8px] hud:text-hud-ink/45">▴</span>
        {/if}
      </div>

      {#if openPanel === "actor" && switchable}
        <!-- The name row sits 1px inside the strip, so 7px lifts the menu 6px clear of its top edge. -->
        <Popover
          offset={7}
          class="hud:flex hud:max-h-[320px] hud:w-[180px] hud:flex-col hud:gap-px hud:overflow-y-auto hud:p-[4px]"
        >
          {#each choices as choice (choice.key)}
            {@const selected = isCurrent(choice)}
            <button
              type="button"
              class="hud:flex hud:cursor-pointer hud:items-center hud:gap-[6px] hud:rounded-hud-sm hud:px-[5px] hud:py-[3px] hud:text-left hud:font-hud hud:text-[12px]/[1.2] hud:font-semibold hud:transition-colors hud:duration-75 {selected
                ? 'hud:bg-hud-accent hud:text-hud-on-accent'
                : 'hud:bg-white/[.045] hud:text-hud-ink/85 hud:hover:bg-white/[.09]'}"
              onclick={() => onselectactor(choice)}
            >
              {#if choice.img}
                <img
                  src={choice.img}
                  alt=""
                  class="hud:h-[18px] hud:w-[18px] hud:flex-none hud:rounded-hud-xs hud:object-cover"
                />
              {:else}
                <span
                  class="hud:h-[18px] hud:w-[18px] hud:flex-none hud:rounded-hud-xs hud:bg-white/[.08]"
                ></span>
              {/if}
              <span class="hud:truncate">{choice.name}</span>
            </button>
          {/each}
        </Popover>
      {/if}
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="hud:relative hud:flex hud:min-h-[96px] hud:flex-1 hud:items-end hud:justify-center"
    data-hud-portrait
    title={enabled ? t("portrait.openSheet") : undefined}
    ondblclick={enabled ? onopensheet : undefined}
  >
    {#if view.img}
      <img
        src={view.img}
        alt=""
        class="hud:absolute hud:inset-0 hud:h-full hud:w-full hud:object-cover"
      />
    {:else}
      <div
        class="hud:absolute hud:inset-0 hud:bg-[repeating-linear-gradient(135deg,#2a2c33_0_6px,#23252b_6px_12px)]"
      ></div>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="hud:absolute hud:top-[4px] hud:left-[5px]"
      data-hud-trigger="posture"
      onmouseenter={enabled ? () => onopen("posture") : undefined}
      onmouseleave={enabled ? onclose : undefined}
      ondblclick={(event) => event.stopPropagation()}
    >
      <span
        class="hud:flex hud:items-center hud:gap-[5px] hud:rounded-hud-xs hud:border hud:border-transparent hud:bg-hud-deep/80 hud:px-[5px] hud:py-px hud:font-hud-mono hud:text-[9px] hud:font-semibold hud:uppercase hud:transition-colors hud:duration-75 {enabled
          ? `hud:hover:border-white/[.18] ${TONE_TEXT[view.posture.tone]}`
          : 'hud:text-hud-ink/28'}"
        title={enabled ? t("portrait.posture") : undefined}
      >
        {view.posture.label}
        {#if enabled}
          <span class="hud:text-[8px] hud:text-hud-ink/45">▴</span>
        {/if}
      </span>

      {#if openPanel === "posture" && enabled}
        <!--
          The badge sits 24px inside the strip (name row, border, offset), so 30px lifts the menu
          6px clear of the strip's top edge like the top bar's panels.
        -->
        <Popover offset={30} class="hud:flex hud:w-[124px] hud:flex-col hud:gap-px hud:p-[4px]">
          {#each view.postures as option (option.id)}
            {@const isSelected = option.id === view.posture.id}
            <button
              type="button"
              class="hud:flex hud:cursor-pointer hud:items-center hud:justify-between hud:rounded-hud-sm hud:px-[7px] hud:py-[3px] hud:text-left hud:font-hud hud:text-[12px]/[1.2] hud:font-semibold hud:transition-colors hud:duration-75 {isSelected
                ? 'hud:bg-hud-accent hud:text-hud-on-accent'
                : `hud:bg-white/[.045] hud:hover:bg-white/[.09] ${TONE_TEXT[option.tone]}`}"
              onclick={() => onposture(option.id)}
            >
              {option.label}
            </button>
          {/each}
        </Popover>
      {/if}
    </div>
    <span
      class="hud:absolute hud:top-[4px] hud:right-[5px] hud:flex hud:items-baseline hud:gap-[4px] hud:rounded-hud-xs hud:bg-hud-deep/80 hud:px-[5px] hud:py-px"
      title={t("portrait.move.title")}
    >
      <span
        class="hud:font-hud-mono hud:text-[9px] hud:font-semibold hud:uppercase hud:text-hud-ink/55"
      >
        {t("portrait.move.label")}
      </span>
      <span class="hud:font-hud-mono hud:text-[11px] hud:font-bold hud:text-hud-ink"
        >{view.move}</span
      >
    </span>
  </div>

  <div class="hud:grid hud:grid-cols-2 hud:gap-[3px] hud:px-[5px] hud:pt-[4px] hud:pb-[5px]">
    <div class="hud:flex hud:items-center hud:gap-[4px]">
      <VitalIcon kind="hp" class={ICON.hp} />
      <PoolField
        pool={view.hp}
        {enabled}
        title={t("portrait.hp")}
        onchange={(value) => onpool("HP", value)}
      />
    </div>

    <div class="hud:flex hud:items-center hud:gap-[4px]">
      <VitalIcon kind="fp" class={ICON.fp} />
      <PoolField
        pool={view.fp}
        {enabled}
        title={t("portrait.fp")}
        onchange={(value) => onpool("FP", value)}
      />
    </div>

    <div
      class="hud:flex hud:items-center hud:gap-[4px]"
      title={enabled ? t("portrait.shock") : undefined}
    >
      <VitalIcon kind="shock" class={ICON.shock} />
      <Readout
        class={view.shock === null
          ? "hud:text-hud-ink/28"
          : view.shock < 0
            ? "hud:text-hud-accent"
            : "hud:text-hud-ink/72"}
      >
        {view.shock ?? "—"}
      </Readout>
    </div>

    <div class="hud:flex hud:items-center hud:gap-[4px]" title={view.condition.title || undefined}>
      <VitalIcon
        kind="condition"
        class={idle
          ? enabled
            ? "hud:text-hud-ink/40"
            : "hud:text-hud-ink/20"
          : TONE_TEXT[view.condition.tone]}
      />
      <Readout
        size={idle ? "md" : "sm"}
        class={idle ? "hud:text-hud-ink/28" : TONE_TEXT[view.condition.tone]}
      >
        {view.condition.label}
      </Readout>
    </div>
  </div>
</div>
