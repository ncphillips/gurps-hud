<script lang="ts">
  import { openSheet, updatePool } from "@/gurps/game-aid";
  import { t } from "@/i18n";
  import { droppedAttack } from "@/gurps/attack-picks";
  import { attackDrag } from "./attack-drag";
  import { saveHudPosition, toggleMinimized } from "@/settings";
  import type { HudPosition } from "@/settings";
  import { tick } from "svelte";
  import MacroBar from "./MacroBar.svelte";
  import PortraitBlock from "./PortraitBlock.svelte";
  import TopBar from "./TopBar.svelte";
  import WeaponTables from "./WeaponTables.svelte";
  import { dockedNear, placeHud } from "./hud-position";
  import { Hud } from "./hud.svelte";

  const hud = new Hud();

  /**
   * The attack being dragged around the tables. Owned here rather than by them because dropping an
   * attack anywhere on the strip has to count as landing: the gesture that removes one is dragging
   * it clear of the strip, so a drop on the top bar or the macro footer must read as a near miss
   * rather than as a deletion.
   */
  let drag = $state(attackDrag());

  let strip = $state<HTMLElement | null>(null);

  /**
   * The drag in progress: where the pointer went down, where the HUD was then, and where it has
   * been put since. Plain rather than reactive -- it only ever moves the element by hand -- and
   * what stops the setting being re-applied underneath a drag whenever some other hook fires.
   */
  let move = null as {
    x: number;
    y: number;
    from: HudPosition;
    to: HudPosition | null;
  } | null;

  /*
   * The element is the HUD's -- the strip's parent, which the modifier bucket is adopted into -- so
   * the bucket moves with it. Re-placed whenever it or the window changes size, because a strip that
   * fitted where it was dropped can outgrow the spot: expanding it, or selecting a longer actor.
   */
  $effect(() => {
    const host = strip?.parentElement;
    if (!host) return;

    const place = () => {
      if (!move) placeHud(host, hud.position);
    };
    place();

    const observer = new ResizeObserver(place);
    observer.observe(host);
    addEventListener("resize", place);
    return () => {
      observer.disconnect();
      removeEventListener("resize", place);
    };
  });

  function grab(event: PointerEvent): void {
    const host = strip?.parentElement;
    if (event.button !== 0 || !host) return;

    // Kept from starting a text selection, which a drag across the tables otherwise would.
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    const box = host.getBoundingClientRect();
    move = {
      x: event.clientX,
      y: event.clientY,
      from: { left: box.left, bottom: innerHeight - box.bottom },
      to: null,
    };
  }

  function haul(event: PointerEvent): void {
    const host = strip?.parentElement;
    if (!move || !host) return;

    move.to = placeHud(host, {
      left: move.from.left + event.clientX - move.x,
      bottom: move.from.bottom - (event.clientY - move.y),
    });
  }

  function drop(): void {
    const to = move?.to;
    move = null;
    // A press with no movement is half of a double-click, not a move to wherever the HUD already is.
    if (to) void saveHudPosition(dockedNear(to));
  }

  /**
   * The actor check is the point of taking the raw event this far up: see `Hud.placeAttack`.
   */
  function placeAttack(event: DragEvent, before: string | null): void {
    hud.placeAttack(droppedAttack(event.dataTransfer?.getData("text/plain")), before);
  }

  /**
   * The button that was clicked is unmounted by the click, so focus follows to the one that undoes
   * it. Only from the strip's own buttons: the keybinding can fire with focus anywhere, and pulling
   * it into the HUD from a chat box would be worse than leaving it.
   */
  async function toggleFromStrip(): Promise<void> {
    await toggleMinimized();
    await tick();
    document
      .querySelector<HTMLElement>(hud.minimized ? "[data-hud-expand]" : "[data-hud-minimize]")
      ?.focus();
  }
</script>

{#snippet macroBar(folded: boolean)}
  <MacroBar {...hud.macroBar.props} {folded} />
{/snippet}

{#snippet grip()}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    data-hud-grip
    title={t("strip.move")}
    class="hud:flex hud:w-[8px] hud:flex-none hud:cursor-grab hud:touch-none hud:items-center hud:justify-center hud:rounded-l-hud hud:border-r hud:border-hud-veil/[.11] hud:text-hud-faint hud:transition-colors hud:duration-75 hud:hover:bg-hud-veil/[.05] hud:hover:text-hud-ink hud:active:cursor-grabbing"
    onpointerdown={grab}
    onpointermove={haul}
    onpointerup={drop}
    onpointercancel={drop}
    ondblclick={() => void saveHudPosition(null)}
  >
    <svg viewBox="0 0 2 14" width="2" height="14" fill="currentColor" aria-hidden="true">
      <circle cx="1" cy="1" r="1" />
      <circle cx="1" cy="5" r="1" />
      <circle cx="1" cy="9" r="1" />
      <circle cx="1" cy="13" r="1" />
    </svg>
  </div>
{/snippet}

{#if hud.minimized}
  <div
    bind:this={strip}
    data-hud-strip
    class="gurps-hud-strip hud:flex hud:w-fit hud:rounded-hud hud:border hud:border-hud-veil/[.11] hud:bg-hud-panel hud:font-hud hud:text-hud-ink"
  >
    {@render grip()}
    <div class="hud:flex hud:items-center hud:p-[6px]">
      <button
        type="button"
        data-hud-expand
        title={t("strip.expand")}
        class="hud:flex hud:h-[22px] hud:w-[22px] hud:flex-none hud:cursor-pointer hud:items-center hud:justify-center hud:rounded-hud-sm hud:border hud:border-transparent hud:bg-hud-veil/[.05] hud:text-hud-faint hud:transition-colors hud:duration-75 hud:hover:border-hud-veil/[.18] hud:hover:bg-hud-veil/[.1] hud:hover:text-hud-ink"
        onclick={toggleFromStrip}
      >
        <svg viewBox="0 0 12 12" width="11" height="11" fill="currentColor" aria-hidden="true">
          <path d="M1.5 1.5h4V3H4.06L6 4.94 4.94 6 3 4.06V5.5H1.5z" />
          <path d="M10.5 10.5h-4V9h1.44L6 7.06 7.06 6 9 7.94V6.5h1.5z" />
        </svg>
      </button>
    </div>

    {#if hud.macroBar.visible}
      {@render macroBar(true)}
    {/if}
  </div>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={strip}
    data-hud-strip
    class="gurps-hud-strip hud:flex hud:max-h-hud-max hud:w-fit hud:rounded-hud hud:border hud:border-hud-veil/[.11] hud:bg-hud-panel hud:font-hud hud:text-hud-ink"
    ondragover={(event) => {
      if (drag.from !== null) event.preventDefault();
    }}
    ondrop={() => (drag.landed = true)}
  >
    {@render grip()}
    <PortraitBlock
      view={hud.view}
      enabled={hud.enabled}
      actor={hud.actor}
      onpool={(pool, value) => void updatePool(hud.actor, pool, value)}
      onopensheet={() => openSheet(hud.actor)}
      locked={hud.locked}
      ontogglelock={hud.toggleLock}
      choices={hud.choices}
      onselectactor={hud.selectActor}
      openPanel={hud.openPanel}
      onposture={hud.selectPosture}
      onshock={hud.toggleShock}
      onclearshock={hud.clearShock}
      onopen={hud.open}
      onclose={hud.close}
      onminimize={toggleFromStrip}
    />

    <div class="hud:flex hud:min-h-0 hud:min-w-0 hud:flex-col">
      <TopBar
        view={hud.view}
        enabled={hud.enabled}
        maneuver={hud.maneuver}
        maneuverEnabled={hud.maneuverEnabled}
        openPanel={hud.openPanel}
        onopen={hud.open}
        onclose={hud.close}
        onselect={hud.selectManeuver}
        targetView={hud.targetView}
        target={hud.target}
        onselecttarget={hud.selectTarget}
        onroll={hud.roll}
      />
      <WeaponTables
        view={hud.view}
        enabled={hud.enabled}
        actorId={hud.actor?.id ?? null}
        bind:drag
        onroll={hud.roll}
        onacc={hud.addAcc}
        onplace={placeAttack}
        onremove={hud.removeAttack}
        onnudge={hud.nudgeAttack}
        onpickall={hud.pickAllAttacks}
      />

      {#if hud.macroBar.visible}
        {@render macroBar(false)}
      {/if}
    </div>
  </div>
{/if}
