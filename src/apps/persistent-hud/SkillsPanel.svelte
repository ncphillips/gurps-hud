<script lang="ts">
  import type { SkillRow } from "@/gurps/hud-view";
  import { t } from "@/i18n";

  /**
   * Every skill on the actor, two to a row, name left and level right. The whole row is the roll
   * button, so there is no small target to aim for. Skill lists run long, so the panel scrolls once
   * it passes its height cap.
   */
  let {
    skills,
    onroll,
  }: {
    skills: SkillRow[];
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const ROW =
    "hud:flex hud:min-w-0 hud:items-baseline hud:gap-[8px] hud:rounded-hud-xs hud:px-[6px] hud:py-0 hud:text-left";
  const NAME =
    "hud:min-w-0 hud:flex-1 hud:truncate hud:font-hud hud:text-[11.5px]/[1.5] hud:font-medium";
  const LEVEL = "hud:flex-none hud:font-hud-mono hud:text-[11.5px]/[1.5] hud:font-bold";
</script>

<!--
  Sizing, the height cap and scrolling belong to the panel surface this renders into (see
  SKILLS_PANEL in TopBar): the mock's 400px is a border-box width, so it has to land on the
  bordered element, and a scrollbar on an inner box renders square inside the rounded corners.
-->
<div class="hud:grid hud:grid-cols-2 hud:content-start hud:gap-x-[6px] hud:gap-y-0 hud:p-[5px]">
  {#each skills as skill (skill.key)}
    {#if skill.level.otf}
      <button
        type="button"
        title={t("skills.roll", { name: skill.name })}
        class="{ROW} hud:group hud:cursor-pointer hud:transition-colors hud:duration-75 hud:hover:bg-hud-accent"
        onclick={(event) => onroll(skill.level.otf!, event)}
      >
        <span class="{NAME} hud:text-hud-ink/75 hud:group-hover:text-hud-on-accent"
          >{skill.name}</span
        >
        <span class="{LEVEL} hud:text-hud-accent hud:group-hover:text-hud-on-accent"
          >{skill.level.text}</span
        >
      </button>
    {:else}
      <div class={ROW}>
        <span class="{NAME} hud:text-hud-ink/45">{skill.name}</span>
        <span class="{LEVEL} hud:text-hud-ink/28">{skill.level.text}</span>
      </div>
    {/if}
  {:else}
    <div
      class="hud:col-span-full hud:px-[6px] hud:py-[2px] hud:font-hud hud:text-[12px] hud:font-medium hud:text-hud-ink/30"
    >
      {t("skills.empty")}
    </div>
  {/each}
</div>
