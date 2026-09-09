<script lang="ts">
  import type { HudView } from "@/gurps/hud-view";
  import { t } from "@/i18n";
  import AttackHandle from "./AttackHandle.svelte";
  import RollValue from "./RollValue.svelte";
  import type { AttackDrag } from "./attack-drag";

  let {
    view,
    enabled,
    actorId,
    drag = $bindable(),
    onroll,
    onplace,
    onremove,
    onnudge,
    onpickall,
  }: {
    view: HudView;
    /** False with nothing selected, which is a different emptiness from an actor who carries nothing. */
    enabled: boolean;
    /** Whose attacks these are, stamped onto every drag the tables start. */
    actorId: string | null;
    /** Owned by the strip, because an attack dragged out of the tables can be dropped off it. */
    drag: AttackDrag;
    onroll: (otf: string, event: MouseEvent) => void;
    /**
     * A drop the tables accepted: the raw event, because the payload may have come from a character
     * sheet and only the strip can say whether it is the right character's.
     *
     * @param before The row it should land ahead of, or null to put it at the end of its group.
     */
    onplace: (event: DragEvent, before: string | null) => void;
    onremove: (key: string) => void;
    onnudge: (key: string, step: number) => void;
    onpickall: () => void;
  } = $props();

  const HEADER =
    "hud:flex hud:gap-[7px] hud:px-[7px] hud:pb-px hud:font-hud-mono hud:text-[8px]/[1.4] hud:font-bold hud:tracking-[.13em] hud:text-hud-ink/30";
  const READOUT = "hud:font-hud-mono hud:text-[10.5px] hud:font-medium hud:text-hud-ink/50";

  /** Keeps the header's columns over the rows', now that every row leads with a grip. */
  const GRIP = "hud:w-[11px] hud:flex-none";

  /**
   * Rows carry a 1px transparent border at rest so hover can only ever change its colour. Anything
   * that added a border on hover would nudge every cell in the row by a pixel.
   *
   * The drop marker is that same border's top edge going accent, because an attack lands *above*
   * the row it was dropped on -- and because recolouring a border that is already there is the only
   * way to mark a row without moving the five below it mid-drag.
   */
  function rowClass(equipped: boolean, dropTarget: boolean): string {
    const base =
      "hud:flex hud:items-center hud:gap-[7px] hud:rounded-hud-sm hud:border hud:px-[7px] hud:py-0 hud:transition-colors hud:duration-75 hud:hover:border-hud-accent/55 hud:hover:bg-white/[.045]";
    const rest = equipped
      ? `${base} hud:border-hud-accent/28 hud:bg-hud-accent/9`
      : `${base} hud:border-transparent hud:bg-transparent`;
    return dropTarget ? `${rest} hud:border-t-hud-accent` : rest;
  }

  /** Insert ahead of this row. Stops here so the container below does not also append it. */
  function dropOn(event: DragEvent, key: string): void {
    event.preventDefault();
    event.stopPropagation();
    drag.over = null;
    drag.landed = true;
    onplace(event, key);
  }

  /** Anywhere in the tables that is not a row: the attack joins the end of whichever group it names. */
  function dropInTables(event: DragEvent): void {
    event.preventDefault();
    drag.over = null;
    drag.landed = true;
    onplace(event, null);
  }

  function dragEnter(event: DragEvent, key: string): void {
    event.preventDefault();
    drag.over = key;
  }

  /** A drag that leaves the strip entirely never fires `dragend` here, so the marker self-clears. */
  function dragLeave(key: string): void {
    if (drag.over === key) drag.over = null;
  }
</script>

<!--
  The strip has a maximum height (see --spacing-hud-max in gurps-hud.css); this is the one region
  allowed to scroll when an actor carries more attacks than fit.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  data-hud-attacks
  class="hud:flex hud:min-h-0 hud:flex-1 hud:flex-col hud:gap-px hud:overflow-y-auto hud:px-[3px] hud:pb-[3px] hud:[scrollbar-color:rgb(255_255_255/.18)_transparent] hud:[scrollbar-width:thin]"
  ondragover={(event) => event.preventDefault()}
  ondrop={dropInTables}
>
  {#if view.melee.length > 0}
    <div class={HEADER}>
      <span class={GRIP}></span>
      <span class="hud:flex-1">{t("weapons.melee")}</span>
      <span class="hud:w-[38px] hud:text-center">{t("weapons.reach")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.level")}</span>
      <span class="hud:w-[62px] hud:px-[4px]">{t("weapons.damage")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.block")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.parry")}</span>
    </div>

    {#each view.melee as row (row.key)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        data-hud-attack={row.key}
        class={rowClass(row.equipped, drag.over === row.key)}
        title={row.equipped ? t("weapons.readied") : undefined}
        ondragover={(event) => event.preventDefault()}
        ondragenter={(event) => dragEnter(event, row.key)}
        ondragleave={() => dragLeave(row.key)}
        ondrop={(event) => dropOn(event, row.key)}
      >
        <AttackHandle
          attackKey={row.key}
          name={row.name}
          {actorId}
          bind:drag
          {onremove}
          {onnudge}
        />
        <span
          class="hud:flex-1 hud:truncate hud:font-hud hud:text-[12.5px]/[1.35] hud:font-semibold hud:text-hud-ink"
          >{row.name}</span
        >
        <span class="hud:w-[38px] hud:text-center {READOUT}">{row.reach}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title={t("weapons.rollLevel")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title={t("weapons.rollDamage")}
          class="hud:w-[62px] hud:px-[4px] hud:font-hud-mono hud:text-[10.5px]/[1.35] hud:font-medium"
          {onroll}
        />
        <RollValue
          cell={row.block}
          variant="defence"
          title={t("weapons.rollDefence")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
        <RollValue
          cell={row.parry}
          variant="defence"
          title={t("weapons.rollDefence")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
      </div>
    {/each}
  {/if}

  {#if view.ranged.length > 0}
    <div class="{HEADER} hud:pt-[5px]">
      <span class={GRIP}></span>
      <span class="hud:flex-1">{t("weapons.ranged")}</span>
      <span class="hud:w-[38px] hud:text-center">{t("weapons.acc")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.level")}</span>
      <span class="hud:w-[62px] hud:px-[4px]">{t("weapons.damage")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.range")}</span>
      <span class="hud:w-[30px] hud:text-center">{t("weapons.rof")}</span>
    </div>

    {#each view.ranged as row (row.key)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        data-hud-attack={row.key}
        class={rowClass(row.equipped, drag.over === row.key)}
        title={row.equipped ? t("weapons.readied") : undefined}
        ondragover={(event) => event.preventDefault()}
        ondragenter={(event) => dragEnter(event, row.key)}
        ondragleave={() => dragLeave(row.key)}
        ondrop={(event) => dropOn(event, row.key)}
      >
        <AttackHandle
          attackKey={row.key}
          name={row.name}
          {actorId}
          bind:drag
          {onremove}
          {onnudge}
        />
        <span
          class="hud:flex-1 hud:truncate hud:font-hud hud:text-[12.5px]/[1.35] hud:font-semibold hud:text-hud-ink"
          >{row.name}</span
        >
        <span class="hud:w-[38px] hud:text-center {READOUT}">{row.acc}</span>
        <RollValue
          cell={row.level}
          variant="accent"
          title={t("weapons.rollLevel")}
          class="hud:w-[30px] hud:text-center hud:font-hud-mono hud:text-[13px]/[1.35] hud:font-bold"
          {onroll}
        />
        <RollValue
          cell={row.damage}
          variant="damage"
          title={t("weapons.rollDamage")}
          class="hud:w-[62px] hud:px-[4px] hud:font-hud-mono hud:text-[10.5px]/[1.35] hud:font-medium"
          {onroll}
        />
        <span class="hud:w-[30px] hud:text-center {READOUT}">{row.range}</span>
        <span class="hud:w-[30px] hud:text-center {READOUT}">{row.rof}</span>
      </div>
    {/each}
  {/if}

  <!--
    Three emptinesses that read the same and mean different things: nobody selected, a character who
    fights with nothing at all, and -- the one every actor starts in -- a character whose attacks
    simply have not been chosen yet. Only the last is worth offering to fill, and this is the only
    place the offer appears, so emptying the list is also how it is taken back.
  -->
  {#if view.melee.length === 0 && view.ranged.length === 0}
    <div
      class="hud:flex hud:items-center hud:gap-[7px] hud:px-[7px] hud:py-[2px] hud:font-hud hud:text-[12px] hud:font-medium hud:text-hud-ink/30"
    >
      {#if !enabled}
        {t("weapons.noActor")}
      {:else if !view.hasAttacks}
        {t("weapons.empty")}
      {:else}
        {t("weapons.unpicked")}
        <button
          type="button"
          data-hud-pick-all
          class="hud:cursor-pointer hud:rounded-hud-sm hud:border hud:border-white/[.18] hud:bg-white/[.05] hud:px-[7px] hud:py-px hud:font-hud hud:text-[12px] hud:font-semibold hud:text-hud-ink/70 hud:transition-colors hud:duration-75 hud:hover:border-hud-accent hud:hover:bg-hud-accent hud:hover:text-hud-on-accent"
          onclick={onpickall}
        >
          {t("weapons.pickAll")}
        </button>
      {/if}
    </div>
  {/if}
</div>
