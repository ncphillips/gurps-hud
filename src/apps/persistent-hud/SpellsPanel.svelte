<script lang="ts">
  import type { SpellRow } from "@/gurps/hud-view";
  import { t } from "@/i18n";

  /**
   * Every spell on the actor, one to a row. Unlike a skill, a spell is weighed before it is rolled
   * -- what it costs, how long it takes to cast, how long it lasts -- so those ride along beside the
   * level rather than living only on the sheet. The whole row casts, as a skill row rolls. Never
   * opened on an empty list: TopBar hides the button for an actor who casts nothing.
   */
  let {
    spells,
    onroll,
  }: {
    spells: SpellRow[];
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const ROW =
    "hud:flex hud:min-w-0 hud:items-baseline hud:gap-[6px] hud:rounded-hud-xs hud:px-[6px] hud:py-0 hud:text-left";
  const NAME =
    "hud:min-w-0 hud:flex-1 hud:truncate hud:font-hud hud:text-[11.5px]/[1.5] hud:font-medium";
  const DETAIL =
    "hud:flex-none hud:truncate hud:text-right hud:font-hud-mono hud:text-[10px]/[1.5] hud:font-medium";
  const DETAIL_TONE = "hud:text-hud-faint hud:group-hover:text-hud-on-accent/80";
  const LEVEL =
    "hud:w-[24px] hud:flex-none hud:text-right hud:font-hud-mono hud:text-[11.5px]/[1.5] hud:font-bold";
  const HEADING =
    "hud:font-hud-mono hud:text-[8px] hud:font-bold hud:tracking-[.13em] hud:text-hud-faint";

  /** Each detail column's width, shared by the heading so the two line up. */
  const COST = "hud:w-[60px]";
  const MAINTAIN = "hud:w-[56px]";
  const TIME = "hud:w-[48px]";
  const DURATION = "hud:w-[48px]";
</script>

<!-- Sizing, the height cap and scrolling belong to the panel surface, as the skills list's do. -->
<div class="hud:flex hud:flex-col hud:p-[5px]">
  <div class="{ROW} hud:pb-[2px]">
    <span class="{HEADING} hud:flex-1">{t("spells.spell")}</span>
    <span class="{HEADING} {COST} hud:text-right">{t("spells.cost")}</span>
    <span class="{HEADING} {MAINTAIN} hud:text-right">{t("spells.maintain")}</span>
    <span class="{HEADING} {TIME} hud:text-right">{t("spells.time")}</span>
    <span class="{HEADING} {DURATION} hud:text-right">{t("spells.duration")}</span>
    <span class="{HEADING} hud:w-[24px] hud:text-right">{t("spells.level")}</span>
  </div>
  {#each spells as spell (spell.key)}
    {#if spell.level.otf}
      <button
        type="button"
        title={t("spells.cast", { name: spell.name })}
        class="{ROW} hud:group hud:cursor-pointer hud:transition-colors hud:duration-75 hud:hover:bg-hud-accent"
        onclick={(event) => onroll(spell.level.otf!, event)}
      >
        <span class="{NAME} hud:text-hud-ink/75 hud:group-hover:text-hud-on-accent"
          >{spell.name}</span
        >
        <span class="{DETAIL} {COST} {DETAIL_TONE}">{spell.cost}</span>
        <span class="{DETAIL} {MAINTAIN} {DETAIL_TONE}">{spell.maintain}</span>
        <span class="{DETAIL} {TIME} {DETAIL_TONE}">{spell.time}</span>
        <span class="{DETAIL} {DURATION} {DETAIL_TONE}">{spell.duration}</span>
        <span class="{LEVEL} hud:text-hud-accent hud:group-hover:text-hud-on-accent"
          >{spell.level.text}</span
        >
      </button>
    {:else}
      <!-- A college: a heading over its spells, with nothing of its own to cast. -->
      <div class={ROW}>
        <span class="{NAME} hud:text-hud-faint">{spell.name}</span>
      </div>
    {/if}
  {/each}
</div>
