<script lang="ts">
  import type { SkillRow } from "@/gurps/hud-view";
  import RollValue from "./RollValue.svelte";

  /**
   * Every skill on the actor, two to a row, in the same value-first layout as the attributes panel.
   * Skill lists run long, so the panel scrolls once it passes its height cap.
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
</script>

<div
  class="grid max-h-[280px] w-[420px] grid-cols-2 content-start gap-x-[6px] gap-y-0 overflow-y-auto p-[5px] [scrollbar-color:rgb(255_255_255/.18)_transparent] [scrollbar-width:thin] {className}"
>
  {#each skills as skill (skill.key)}
    <div
      class="flex min-w-0 items-baseline gap-[6px] rounded-hud-xs px-[5px] py-0 transition-colors duration-75 hover:bg-white/[.06]"
    >
      <RollValue
        cell={skill.level}
        variant="accent"
        title="Roll against {skill.name}"
        class="w-[24px] flex-none text-left font-hud-mono text-[11.5px]/[1.5] font-bold"
        {onroll}
      />
      <span
        class="truncate font-hud text-[11.5px]/[1.5] font-medium text-hud-ink/70"
        title={skill.name}>{skill.name}</span
      >
      {#if skill.rsl}
        <span class="ml-auto flex-none font-hud-mono text-[9.5px]/[1.5] font-medium text-hud-ink/35"
          >{skill.rsl}</span
        >
      {/if}
    </div>
  {:else}
    <div class="col-span-full px-[5px] py-[2px] font-hud text-[12px] font-medium text-hud-ink/30">
      No skills on this actor.
    </div>
  {/each}
</div>
