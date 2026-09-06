<script lang="ts">
  import type { HudView } from "@/gurps/hud-view";
  import { HUD_MANEUVERS } from "@/gurps/maneuvers";
  import type { HudManeuver } from "@/gurps/maneuvers";
  import AttrsPanel from "./AttrsPanel.svelte";
  import SkillsPanel from "./SkillsPanel.svelte";

  export type Panel = "attrs" | "skills" | "maneuver";

  /**
   * One row across the top of the strip: attributes, skills, Dodge and the maneuver. Every popover
   * anchors here so it opens upward, clear of the strip.
   */
  let {
    view,
    maneuver,
    maneuverEnabled,
    openPanel,
    onopen,
    onclose,
    onselect,
    onroll,
  }: {
    view: HudView;
    /** What the actor is actually performing, or `null` when it has no maneuver. */
    maneuver: HudManeuver | null;
    /** False when the Game Aid would refuse the change -- the actor is not in the active combat. */
    maneuverEnabled: boolean;
    openPanel: Panel | null;
    onopen: (panel: Panel) => void;
    onclose: () => void;
    onselect: (id: string) => void;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const maneuverTitle = $derived(
    maneuverEnabled
      ? (maneuver?.hint ?? "Maneuver")
      : "Maneuvers can only be set for a token in the active combat",
  );

  /*
   * Every control in the bar shares one chrome: a mono label, an optional value, and for hover
   * panels a caret. Hover only recolours, so the bar never shifts under the cursor.
   */
  const TRIGGER =
    "group flex items-center gap-[8px] rounded-hud-sm border border-white/[.09] bg-white/[.06] px-[7px] py-[4px] transition-colors duration-75";
  const TRIGGER_HOVER = "hover:border-hud-accent hover:bg-hud-accent";
  const LABEL = "font-hud-mono text-[9px] font-bold tracking-[.12em] text-hud-ink/60";
  const LABEL_HOVER = "group-hover:text-hud-on-accent";
  const CARET = "font-hud-mono text-[9px] font-bold text-hud-ink/45";
  const CARET_HOVER = "group-hover:text-hud-on-accent/55";

  /*
   * Popovers sit 10px above their trigger: the trigger's top is 4px inside the strip (1px border,
   * 3px padding), so this puts each panel 6px clear of the strip's top edge.
   */
  const POPOVER =
    "absolute bottom-[calc(100%+10px)] z-20 rounded-hud-lg border border-white/[.15] bg-hud-popover shadow-hud-popover";
</script>

{#snippet trigger(label: string, title: string)}
  <div class="{TRIGGER} {TRIGGER_HOVER}" {title}>
    <span class="{LABEL} {LABEL_HOVER}">{label}</span>
    <span class="{CARET} {CARET_HOVER}">▴</span>
  </div>
{/snippet}

<div class="flex items-center gap-[4px] p-[3px]">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative"
    data-hud-trigger="attrs"
    onmouseenter={() => onopen("attrs")}
    onmouseleave={onclose}
  >
    {@render trigger("ATTRS", "Attributes")}
    {#if openPanel === "attrs"}
      <AttrsPanel
        basic={view.attrs.basic}
        secondary={view.attrs.secondary}
        class="{POPOVER} left-0"
        {onroll}
      />
    {/if}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative"
    data-hud-trigger="skills"
    onmouseenter={() => onopen("skills")}
    onmouseleave={onclose}
  >
    {@render trigger("SKILLS", "Skills")}
    {#if openPanel === "skills"}
      <SkillsPanel skills={view.skills} class="{POPOVER} left-0" {onroll} />
    {/if}
  </div>

  <div class="mx-[2px] h-[18px] w-px bg-white/[.09]"></div>

  <button
    type="button"
    title="Roll Dodge"
    class="{TRIGGER} cursor-pointer hover:border-hud-defence hover:bg-hud-defence"
    onclick={(event) => onroll("Dodge", event)}
  >
    <span class="{LABEL} {LABEL_HOVER}">DODGE</span>
    <span
      class="font-hud-mono text-[13px]/none font-bold text-hud-defence group-hover:text-hud-on-accent"
    >
      {view.dodge}
    </span>
  </button>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative"
    data-hud-trigger="maneuver"
    onmouseenter={maneuverEnabled ? () => onopen("maneuver") : undefined}
    onmouseleave={onclose}
  >
    <div
      class="{TRIGGER} min-w-[150px] {maneuverEnabled ? TRIGGER_HOVER : ''}"
      title={maneuverTitle}
    >
      <span class="{LABEL} {maneuverEnabled ? LABEL_HOVER : 'text-hud-ink/32'}">MANEUVER</span>
      <span
        class="font-hud text-[13px]/none font-bold tracking-[.02em] whitespace-nowrap {maneuverEnabled
          ? 'text-hud-ink group-hover:text-hud-on-accent'
          : 'text-hud-ink/35'}"
      >
        {maneuver?.name ?? "—"}
      </span>
      {#if maneuverEnabled}
        <span class="{CARET} {CARET_HOVER} ml-auto">▴</span>
      {/if}
    </div>

    {#if openPanel === "maneuver" && maneuverEnabled}
      <div class="{POPOVER} left-0 grid w-[464px] grid-cols-2 gap-[2px] p-[5px]">
        {#each HUD_MANEUVERS as option (option.id)}
          {@const isSelected = option.id === maneuver?.id}
          <button
            type="button"
            class="flex cursor-pointer flex-col rounded-hud-sm px-[8px] py-[4px] text-left transition-colors duration-75 {isSelected
              ? 'bg-hud-accent'
              : 'bg-white/[.045] hover:bg-white/[.09]'}"
            onclick={() => onselect(option.id)}
          >
            <span
              class="font-hud text-[12.5px]/[1.15] font-semibold {isSelected
                ? 'text-hud-on-accent'
                : 'text-hud-ink/78'}"
            >
              {option.name}
            </span>
            <span
              class="font-hud text-[10px]/[1.2] font-medium {isSelected
                ? 'text-hud-on-accent/72'
                : 'text-hud-ink/38'}"
            >
              {option.hint}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
