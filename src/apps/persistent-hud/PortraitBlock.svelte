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
    ok: "text-hud-ok",
    warn: "text-hud-accent",
    danger: "text-hud-hp",
  };

  const idle = $derived(view.condition.label === "—");

  /** With no actor the vitals icons stay in place, dimmed, so the cells read as blank not zeroed. */
  const ICON = $derived({
    hp: enabled ? "text-hud-hp" : "text-hud-hp/40",
    fp: enabled ? "text-hud-fp" : "text-hud-fp/40",
    shock: enabled ? "text-hud-accent" : "text-hud-accent/40",
  });
</script>

<div
  class="flex w-[143px] flex-none flex-col rounded-l-hud border-r border-white/[.08] bg-hud-deep"
>
  <div class="flex items-center gap-[2px] pr-[7px] pl-[3px] py-[2px]">
    <button
      type="button"
      class="flex h-[14px] w-[14px] flex-none items-center justify-center rounded-hud-xs border border-transparent transition-colors duration-75 {enabled
        ? 'cursor-pointer hover:border-white/[.18] hover:bg-white/[.08]'
        : 'text-hud-ink/20'} {locked
        ? 'text-hud-accent'
        : enabled
          ? 'text-hud-ink/35 hover:text-hud-ink/70'
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
      class="relative min-w-0 flex-1"
      data-hud-trigger="actor"
      onmouseenter={switchable ? () => onopen("actor") : undefined}
      onmouseleave={switchable ? onclose : undefined}
    >
      <div
        class="flex items-center justify-center gap-[4px] rounded-hud-xs border border-transparent px-[3px] font-hud text-[12.5px]/[1.25] font-semibold text-hud-ink transition-colors duration-75 {switchable
          ? 'hover:border-white/[.18] hover:bg-white/[.06]'
          : ''}"
        title={!enabled
          ? t("portrait.selectCharacter")
          : switchable
            ? t("portrait.switchCharacter", { name: view.name })
            : view.name}
      >
        <span class="truncate">{view.name}</span>
        {#if switchable}
          <span class="flex-none text-[8px] text-hud-ink/45">▴</span>
        {/if}
      </div>

      {#if openPanel === "actor" && switchable}
        <!-- The name row sits 1px inside the strip, so 7px lifts the menu 6px clear of its top edge. -->
        <Popover
          offset={7}
          class="flex max-h-[320px] w-[180px] flex-col gap-px overflow-y-auto p-[4px]"
        >
          {#each choices as choice (choice.key)}
            {@const selected = isCurrent(choice)}
            <button
              type="button"
              class="flex cursor-pointer items-center gap-[6px] rounded-hud-sm px-[5px] py-[3px] text-left font-hud text-[12px]/[1.2] font-semibold transition-colors duration-75 {selected
                ? 'bg-hud-accent text-hud-on-accent'
                : 'bg-white/[.045] text-hud-ink/85 hover:bg-white/[.09]'}"
              onclick={() => onselectactor(choice)}
            >
              {#if choice.img}
                <img
                  src={choice.img}
                  alt=""
                  class="h-[18px] w-[18px] flex-none rounded-hud-xs object-cover"
                />
              {:else}
                <span class="h-[18px] w-[18px] flex-none rounded-hud-xs bg-white/[.08]"></span>
              {/if}
              <span class="truncate">{choice.name}</span>
            </button>
          {/each}
        </Popover>
      {/if}
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative flex min-h-[96px] flex-1 items-end justify-center"
    data-hud-portrait
    title={enabled ? t("portrait.openSheet") : undefined}
    ondblclick={enabled ? onopensheet : undefined}
  >
    {#if view.img}
      <img src={view.img} alt="" class="absolute inset-0 h-full w-full object-cover" />
    {:else}
      <div
        class="absolute inset-0 bg-[repeating-linear-gradient(135deg,#2a2c33_0_6px,#23252b_6px_12px)]"
      ></div>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute top-[4px] left-[5px]"
      data-hud-trigger="posture"
      onmouseenter={enabled ? () => onopen("posture") : undefined}
      onmouseleave={enabled ? onclose : undefined}
      ondblclick={(event) => event.stopPropagation()}
    >
      <span
        class="flex items-center gap-[5px] rounded-hud-xs border border-transparent bg-hud-deep/80 px-[5px] py-px font-hud-mono text-[9px] font-semibold uppercase transition-colors duration-75 {enabled
          ? `hover:border-white/[.18] ${TONE_TEXT[view.posture.tone]}`
          : 'text-hud-ink/28'}"
        title={enabled ? t("portrait.posture") : undefined}
      >
        {view.posture.label}
        {#if enabled}
          <span class="text-[8px] text-hud-ink/45">▴</span>
        {/if}
      </span>

      {#if openPanel === "posture" && enabled}
        <!--
          The badge sits 24px inside the strip (name row, border, offset), so 30px lifts the menu
          6px clear of the strip's top edge like the top bar's panels.
        -->
        <Popover offset={30} class="flex w-[124px] flex-col gap-px p-[4px]">
          {#each view.postures as option (option.id)}
            {@const isSelected = option.id === view.posture.id}
            <button
              type="button"
              class="flex cursor-pointer items-center justify-between rounded-hud-sm px-[7px] py-[3px] text-left font-hud text-[12px]/[1.2] font-semibold transition-colors duration-75 {isSelected
                ? 'bg-hud-accent text-hud-on-accent'
                : `bg-white/[.045] hover:bg-white/[.09] ${TONE_TEXT[option.tone]}`}"
              onclick={() => onposture(option.id)}
            >
              {option.label}
            </button>
          {/each}
        </Popover>
      {/if}
    </div>
    <span
      class="absolute top-[4px] right-[5px] flex items-baseline gap-[4px] rounded-hud-xs bg-hud-deep/80 px-[5px] py-px"
      title={t("portrait.move.title")}
    >
      <span class="font-hud-mono text-[9px] font-semibold uppercase text-hud-ink/55">
        {t("portrait.move.label")}
      </span>
      <span class="font-hud-mono text-[11px] font-bold text-hud-ink">{view.move}</span>
    </span>
  </div>

  <div class="grid grid-cols-2 gap-[3px] px-[5px] pt-[4px] pb-[5px]">
    <div class="flex items-center gap-[4px]">
      <VitalIcon kind="hp" class={ICON.hp} />
      <PoolField
        pool={view.hp}
        {enabled}
        title={t("portrait.hp")}
        onchange={(value) => onpool("HP", value)}
      />
    </div>

    <div class="flex items-center gap-[4px]">
      <VitalIcon kind="fp" class={ICON.fp} />
      <PoolField
        pool={view.fp}
        {enabled}
        title={t("portrait.fp")}
        onchange={(value) => onpool("FP", value)}
      />
    </div>

    <div class="flex items-center gap-[4px]" title={enabled ? t("portrait.shock") : undefined}>
      <VitalIcon kind="shock" class={ICON.shock} />
      <Readout
        class={view.shock === null
          ? "text-hud-ink/28"
          : view.shock < 0
            ? "text-hud-accent"
            : "text-hud-ink/72"}
      >
        {view.shock ?? "—"}
      </Readout>
    </div>

    <div class="flex items-center gap-[4px]" title={view.condition.title || undefined}>
      <VitalIcon
        kind="condition"
        class={idle
          ? enabled
            ? "text-hud-ink/40"
            : "text-hud-ink/20"
          : TONE_TEXT[view.condition.tone]}
      />
      <Readout
        size={idle ? "md" : "sm"}
        class={idle ? "text-hud-ink/28" : TONE_TEXT[view.condition.tone]}
      >
        {view.condition.label}
      </Readout>
    </div>
  </div>
</div>
