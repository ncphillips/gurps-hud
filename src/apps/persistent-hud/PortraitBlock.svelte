<script lang="ts">
  import type { HudView, Tone } from "@/gurps/hud-view";

  let { view }: { view: HudView } = $props();

  const TONE_TEXT: Record<Tone, string> = {
    ok: "text-hud-ok",
    warn: "text-hud-accent",
    danger: "text-hud-hp",
  };

  const POOL_TEXT: Record<Tone, string> = {
    ok: "text-hud-ink",
    warn: "text-hud-accent",
    danger: "text-hud-hp",
  };

  const idle = $derived(view.condition.label === "—");

  const VITAL_BOX =
    "flex-1 rounded-hud-xs bg-white/[.07] px-[4px] py-px text-right font-hud-mono text-[12px] font-bold";
</script>

<div
  class="flex w-[143px] flex-none flex-col overflow-hidden rounded-l-hud border-r border-white/[.08] bg-hud-deep"
>
  <div
    class="truncate px-[7px] py-[2px] text-center font-hud text-[12.5px]/[1.25] font-semibold text-hud-ink"
    title={view.name}
  >
    {view.name}
  </div>

  <div class="relative flex min-h-[96px] flex-1 items-end justify-center">
    {#if view.img}
      <img src={view.img} alt="" class="absolute inset-0 h-full w-full object-cover" />
    {:else}
      <div
        class="absolute inset-0 bg-[repeating-linear-gradient(135deg,#2a2c33_0_6px,#23252b_6px_12px)]"
      ></div>
    {/if}
    <span
      class="absolute top-[4px] left-[5px] rounded-hud-xs bg-hud-deep/80 px-[5px] py-px font-hud-mono text-[9px] font-semibold uppercase {TONE_TEXT[
        view.posture.tone
      ]}"
    >
      {view.posture.label}
    </span>
  </div>

  <div class="grid grid-cols-2 gap-[3px] px-[5px] pt-[4px] pb-[5px]">
    <div class="flex items-center gap-[4px]" title="Hit Points">
      <span
        class="h-[9px] w-[9px] flex-none bg-hud-hp [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
      ></span>
      <span class="{VITAL_BOX} {POOL_TEXT[view.hp.tone]}">
        {view.hp.value}<span class="text-[9.5px] text-hud-ink/45">/{view.hp.max}</span>
      </span>
    </div>

    <div class="flex items-center gap-[4px]" title="Fatigue Points">
      <span class="h-[9px] w-[9px] flex-none rounded-full bg-hud-fp"></span>
      <span class="{VITAL_BOX} {POOL_TEXT[view.fp.tone]}">
        {view.fp.value}<span class="text-[9.5px] text-hud-ink/45">/{view.fp.max}</span>
      </span>
    </div>

    <div class="flex items-center gap-[4px]" title="Shock penalty to DX and IQ">
      <span class="h-[9px] w-[9px] flex-none bg-hud-accent"></span>
      <span class="{VITAL_BOX} {view.shock < 0 ? 'text-hud-accent' : 'text-hud-ink/72'}">
        {view.shock}
      </span>
    </div>

    <div class="flex items-center gap-[4px]" title={view.condition.title}>
      <span
        class="h-[9px] w-[9px] flex-none bg-hud-ink/50 [clip-path:polygon(50%_0,100%_100%,0_100%)]"
      ></span>
      <span
        class="flex-1 rounded-hud-xs bg-white/[.07] px-[4px] py-px text-right font-hud-mono font-bold {idle
          ? 'text-[12px] text-hud-ink/28'
          : `text-[9px] ${TONE_TEXT[view.condition.tone]}`}"
      >
        {view.condition.label}
      </span>
    </div>
  </div>
</div>
