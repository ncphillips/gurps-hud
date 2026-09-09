<script lang="ts">
  import type { HudView, TargetView } from "@/gurps/hud-view";
  import { maneuverGroups } from "@/gurps/maneuvers";
  import type { HudManeuver } from "@/gurps/maneuvers";
  import { t } from "@/i18n";
  import Popover from "@/ui/Popover.svelte";
  import AttrsPanel from "./AttrsPanel.svelte";
  import SkillsPanel from "./SkillsPanel.svelte";
  import type { Panel } from "./panels";

  /**
   * One row across the top of the strip: attributes, skills, Dodge, the maneuver and the target hit
   * location. Every popover anchors here so it opens upward, clear of the strip.
   */
  let {
    view,
    enabled,
    maneuver,
    maneuverEnabled,
    openPanel,
    onopen,
    onclose,
    onselect,
    targetView,
    target,
    onselecttarget,
    onroll,
  }: {
    view: HudView;
    /** False with nothing selected: the bar still renders, but nothing in it acts on an actor. */
    enabled: boolean;
    /** What the actor is actually performing, or `null` when it has no maneuver. */
    maneuver: HudManeuver | null;
    /** False when the Game Aid would refuse the change -- the actor is not in the active combat. */
    maneuverEnabled: boolean;
    openPanel: Panel | null;
    onopen: (panel: Panel) => void;
    onclose: () => void;
    onselect: (id: string) => void;
    /** The token the user is targeting, or `null` when there is none to aim at. */
    targetView: TargetView | null;
    /** The hit location attacks are aimed at, by the Game Aid's `where` name. */
    target: string;
    onselecttarget: (where: string) => void;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const targetRow = $derived(
    targetView?.hitLocations.find((location) => location.where === target),
  );
  const targetTitle = $derived.by(() => {
    if (!targetView) return t("topBar.target.untargeted");
    const aimed = { name: targetView.name, location: target };
    return targetRow && targetRow.penalty !== 0
      ? t("topBar.target.aimedWithPenalty", { ...aimed, penalty: targetRow.penalty })
      : t("topBar.target.aimed", aimed);
  });

  function penaltyText(penalty: number): string {
    return penalty === 0 ? "—" : String(penalty);
  }

  const maneuverTitle = $derived(
    maneuverEnabled
      ? (maneuver?.hint ?? t("topBar.maneuver.title"))
      : t("topBar.maneuver.disabled"),
  );

  /** Read once at mount: Foundry has settled its language long before the strip renders. */
  const groups = maneuverGroups();

  /*
   * Every control in the bar shares one chrome: a mono label, an optional value, and for hover
   * panels a caret. Hover only recolours, so the bar never shifts under the cursor.
   */
  const TRIGGER =
    "hud:group hud:flex hud:items-center hud:gap-[8px] hud:rounded-hud-sm hud:border hud:border-white/[.09] hud:bg-white/[.06] hud:px-[7px] hud:py-[4px] hud:transition-colors hud:duration-75";
  const TRIGGER_HOVER = "hud:hover:border-hud-accent hud:hover:bg-hud-accent";
  const LABEL =
    "hud:font-hud-mono hud:text-[9px] hud:font-bold hud:tracking-[.12em] hud:text-hud-ink/60";
  const LABEL_HOVER = "hud:group-hover:text-hud-on-accent";
  const CARET = "hud:font-hud-mono hud:text-[9px] hud:font-bold hud:text-hud-ink/45";
  const CARET_HOVER = "hud:group-hover:text-hud-on-accent/55";

  /*
   * Panels sit 10px above their trigger: the trigger's top is 4px inside the strip (1px border,
   * 3px padding), so this puts each one 6px clear of the strip's top edge.
   */
  const OFFSET = 10;

  /*
   * The skills list is the one panel that can outgrow its cap, so it -- not a box inside it --
   * carries the width, the cap and the scrolling. 400px is the mock's width under border-box.
   */
  const SKILLS_PANEL =
    "hud:max-h-[280px] hud:w-[400px] hud:overflow-y-auto hud:[scrollbar-color:rgb(255_255_255/.18)_transparent] hud:[scrollbar-width:thin]";
</script>

{#snippet trigger(label: string, title: string, active: boolean)}
  <div class="{TRIGGER} {active ? TRIGGER_HOVER : ''}" title={active ? title : undefined}>
    <span class="{LABEL} {active ? LABEL_HOVER : 'hud:text-hud-ink/32'}">{label}</span>
    {#if active}
      <span class="{CARET} {CARET_HOVER}">▴</span>
    {/if}
  </div>
{/snippet}

<div class="hud:flex hud:items-center hud:gap-[4px] hud:p-[3px]">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="hud:relative"
    data-hud-trigger="attrs"
    onmouseenter={enabled ? () => onopen("attrs") : undefined}
    onmouseleave={enabled ? onclose : undefined}
  >
    {@render trigger(t("topBar.attrs.label"), t("topBar.attrs.title"), enabled)}
    {#if openPanel === "attrs" && enabled}
      <Popover offset={OFFSET}>
        <AttrsPanel basic={view.attrs.basic} secondary={view.attrs.secondary} {onroll} />
      </Popover>
    {/if}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="hud:relative"
    data-hud-trigger="skills"
    onmouseenter={enabled ? () => onopen("skills") : undefined}
    onmouseleave={enabled ? onclose : undefined}
  >
    {@render trigger(t("topBar.skills.label"), t("topBar.skills.title"), enabled)}
    {#if openPanel === "skills" && enabled}
      <Popover offset={OFFSET} class={SKILLS_PANEL}>
        <SkillsPanel skills={view.skills} {onroll} />
      </Popover>
    {/if}
  </div>

  <div class="hud:mx-[2px] hud:h-[18px] hud:w-px hud:bg-white/[.09]"></div>

  <button
    type="button"
    title={t("topBar.dodge.title")}
    class="{TRIGGER} {enabled
      ? 'hud:cursor-pointer hud:hover:border-hud-defence hud:hover:bg-hud-defence'
      : ''}"
    disabled={!enabled}
    onclick={(event) => onroll("Dodge", event)}
  >
    <span class="{LABEL} {enabled ? LABEL_HOVER : 'hud:text-hud-ink/32'}"
      >{t("topBar.dodge.label")}</span
    >
    <span
      class="hud:font-hud-mono hud:text-[13px]/none hud:font-bold {enabled
        ? 'hud:text-hud-defence hud:group-hover:text-hud-on-accent'
        : 'hud:text-hud-ink/35'}"
    >
      {view.dodge}
    </span>
  </button>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="hud:relative"
    data-hud-trigger="maneuver"
    onmouseenter={maneuverEnabled ? () => onopen("maneuver") : undefined}
    onmouseleave={onclose}
  >
    <div
      class="{TRIGGER} hud:min-w-[140px] {maneuverEnabled ? TRIGGER_HOVER : ''}"
      title={maneuverTitle}
    >
      <span class="{LABEL} {maneuverEnabled ? LABEL_HOVER : 'hud:text-hud-ink/32'}">
        {t("topBar.maneuver.label")}
      </span>
      <span
        class="hud:font-hud hud:text-[11.5px]/none hud:font-semibold hud:tracking-[.01em] hud:whitespace-nowrap {maneuverEnabled
          ? 'hud:text-hud-ink hud:group-hover:text-hud-on-accent'
          : 'hud:text-hud-ink/35'}"
      >
        {maneuver?.name ?? "—"}
      </span>
      {#if maneuverEnabled}
        <span class="{CARET} {CARET_HOVER} hud:ml-auto">▴</span>
      {/if}
    </div>

    {#if openPanel === "maneuver" && maneuverEnabled}
      <Popover
        offset={OFFSET}
        name="maneuver"
        class="hud:grid hud:w-[464px] hud:grid-cols-2 hud:gap-[2px] hud:p-[5px]"
      >
        {#each groups as group, index (group.heading ?? index)}
          {#if group.heading}
            <div
              data-hud-maneuver-heading={group.heading}
              class="hud:col-span-2 hud:px-[8px] hud:pt-[6px] hud:pb-[2px] hud:font-hud-mono hud:text-[8px] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/30"
            >
              {group.heading.toUpperCase()}
            </div>
          {/if}
          {#each group.maneuvers as option (option.id)}
            {@const isSelected = option.id === maneuver?.id}
            <button
              type="button"
              data-hud-maneuver={option.id}
              class="hud:flex hud:cursor-pointer hud:items-baseline hud:gap-[6px] hud:overflow-hidden hud:rounded-hud-sm hud:px-[7px] hud:py-[2px] hud:text-left hud:whitespace-nowrap hud:transition-colors hud:duration-75 {isSelected
                ? 'hud:bg-hud-accent'
                : 'hud:bg-white/[.045] hud:hover:bg-white/[.09]'}"
              onclick={() => onselect(option.id)}
            >
              <span
                class="hud:font-hud hud:text-[12.5px]/[1.45] hud:font-semibold {isSelected
                  ? 'hud:text-hud-on-accent'
                  : 'hud:text-hud-ink/78'}"
              >
                {option.name}
              </span>
              <span
                class="hud:truncate hud:font-hud hud:text-[10px]/[1.45] hud:font-medium {isSelected
                  ? 'hud:text-hud-on-accent/72'
                  : 'hud:text-hud-ink/38'}"
              >
                {option.hint}
              </span>
            </button>
          {/each}
        {/each}
      </Popover>
    {/if}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="hud:relative"
    data-hud-trigger="target"
    onmouseenter={targetView ? () => onopen("target") : undefined}
    onmouseleave={onclose}
  >
    <div class="{TRIGGER} {targetView ? TRIGGER_HOVER : ''}" title={targetTitle}>
      <span class="{LABEL} {targetView ? LABEL_HOVER : 'hud:text-hud-ink/32'}">
        {t("topBar.target.label")}
      </span>
      <span
        class="hud:font-hud hud:text-[11.5px]/none hud:font-semibold hud:tracking-[.01em] hud:whitespace-nowrap {targetView
          ? 'hud:text-hud-ink hud:group-hover:text-hud-on-accent'
          : 'hud:text-hud-ink/35'}"
      >
        {targetView ? target : "—"}
      </span>
      {#if targetRow && targetRow.penalty !== 0}
        <span
          class="hud:font-hud-mono hud:text-[10.5px]/none hud:font-bold hud:text-hud-hp hud:group-hover:text-hud-on-accent/70"
        >
          {targetRow.penalty}
        </span>
      {/if}
      {#if targetView}
        <span class="{CARET} {CARET_HOVER}">▴</span>
      {/if}
    </div>

    {#if openPanel === "target" && targetView}
      <Popover
        offset={OFFSET}
        align="right"
        class="hud:flex hud:w-[236px] hud:flex-col hud:p-[5px]"
      >
        <div
          class="hud:flex hud:gap-[6px] hud:px-[7px] hud:pb-[2px] hud:font-hud-mono hud:text-[8px] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/30"
        >
          <span class="hud:w-[36px]">{t("topBar.target.roll")}</span>
          <span class="hud:flex-1">{t("topBar.target.location")}</span>
          <span class="hud:w-[28px] hud:text-right">{t("topBar.target.hit")}</span>
          <span class="hud:w-[22px] hud:text-right">{t("topBar.target.dr")}</span>
        </div>
        {#each targetView.hitLocations as location (location.key)}
          {@const isSelected = location.where === target}
          <button
            type="button"
            class="hud:flex hud:cursor-pointer hud:items-baseline hud:gap-[6px] hud:rounded-hud-sm hud:px-[7px] hud:py-[2px] hud:text-left hud:transition-colors hud:duration-75 {isSelected
              ? 'hud:bg-hud-accent hud:text-hud-on-accent'
              : 'hud:hover:bg-white/[.08]'}"
            onclick={() => onselecttarget(location.where)}
          >
            <span
              class="hud:w-[36px] hud:font-hud-mono hud:text-[9.5px] hud:font-medium {isSelected
                ? 'hud:text-hud-on-accent/70'
                : 'hud:text-hud-ink/40'}">{location.roll || "—"}</span
            >
            <span
              class="hud:flex-1 hud:truncate hud:font-hud hud:text-[12px]/[1.3] hud:font-semibold {isSelected
                ? ''
                : 'hud:text-hud-ink/80'}">{location.where}</span
            >
            <span
              class="hud:w-[28px] hud:text-right hud:font-hud-mono hud:text-[11px] hud:font-bold {isSelected
                ? ''
                : location.penalty === 0
                  ? 'hud:text-hud-ink/30'
                  : 'hud:text-hud-hp'}">{penaltyText(location.penalty)}</span
            >
            <span
              class="hud:w-[22px] hud:text-right hud:font-hud-mono hud:text-[10.5px] hud:font-medium {isSelected
                ? 'hud:text-hud-on-accent/70'
                : 'hud:text-hud-ink/50'}">{location.dr || "—"}</span
            >
          </button>
        {:else}
          <div
            class="hud:px-[7px] hud:py-[2px] hud:font-hud hud:text-[12px] hud:font-medium hud:text-hud-ink/30"
          >
            {t("topBar.target.empty", { name: targetView.name })}
          </div>
        {/each}
      </Popover>
    {/if}
  </div>
</div>
