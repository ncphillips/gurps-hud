<script lang="ts">
  import type { SkillRow } from "@/gurps/hud-view";

  /**
   * Every skill on the actor, two to a row, name left and level right. The whole row is the roll
   * button, so there is no small target to aim for. Skill lists run long, so the panel scrolls once
   * it passes its height cap.
   */
  let {
    skills,
    class: className = "",
    onroll,
  }: {
    skills: SkillRow[];
    class?: string;
    onroll: (otf: string, event: MouseEvent) => void;
  } = $props();

  const ROW = "flex min-w-0 items-baseline gap-[8px] rounded-hud-xs px-[6px] py-0 text-left";
  const NAME = "min-w-0 flex-1 truncate font-hud text-[11.5px]/[1.5] font-medium";
  const LEVEL = "flex-none font-hud-mono text-[11.5px]/[1.5] font-bold";
</script>

<div
  class="grid max-h-[280px] w-[400px] grid-cols-2 content-start gap-x-[6px] gap-y-0 overflow-y-auto p-[5px] [scrollbar-color:rgb(255_255_255/.18)_transparent] [scrollbar-width:thin] {className}"
>
  {#each skills as skill (skill.key)}
    {#if skill.level.otf}
      <button
        type="button"
        title="Roll against {skill.name}"
        class="{ROW} group cursor-pointer transition-colors duration-75 hover:bg-hud-accent"
        onclick={(event) => onroll(skill.level.otf!, event)}
      >
        <span class="{NAME} text-hud-ink/75 group-hover:text-hud-on-accent">{skill.name}</span>
        <span class="{LEVEL} text-hud-accent group-hover:text-hud-on-accent"
          >{skill.level.text}</span
        >
      </button>
    {:else}
      <div class={ROW}>
        <span class="{NAME} text-hud-ink/45">{skill.name}</span>
        <span class="{LEVEL} text-hud-ink/28">{skill.level.text}</span>
      </div>
    {/if}
  {:else}
    <div class="col-span-full px-[6px] py-[2px] font-hud text-[12px] font-medium text-hud-ink/30">
      No skills on this actor.
    </div>
  {/each}
</div>
