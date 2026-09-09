<script lang="ts">
  import { dragPayload } from "@/gurps/attack-picks";
  import { t } from "@/i18n";
  import type { AttackDrag } from "./attack-drag";

  /**
   * The grip an attack row is picked up by. It is the sheet's own affordance -- the GURPS character
   * sheet puts a `grip-dots-vertical` at the head of every draggable row -- redrawn as inline SVG
   * rather than a Font Awesome glyph, because the HUD carries no icon font of its own.
   */
  let {
    attackKey,
    name,
    actorId,
    drag = $bindable(),
    onremove,
    onnudge,
  }: {
    attackKey: string;
    /** The row's name, so the button says which attack it grips. */
    name: string;
    /** Stamped into the payload, so a drop can tell whose sheet the attack is from. */
    actorId: string | null;
    /** Written to, not just read: picking a row up and putting it down is what a drag is. */
    drag: AttackDrag;
    onremove: (key: string) => void;
    onnudge: (key: string, step: number) => void;
  } = $props();

  function dragStart(event: DragEvent): void {
    drag.from = attackKey;
    drag.landed = false;
    event.dataTransfer?.setData("text/plain", dragPayload(actorId, attackKey));
  }

  /**
   * A drag that ended without the strip taking the drop went off the strip, and that is how an
   * attack is removed -- the same gesture as flicking a macro off the hotbar. Dropping it somewhere
   * on the strip that is not an attack row does nothing at all: the strip marks the drop as landed
   * even where it cannot act on it, so a near miss is a near miss rather than a deletion.
   */
  function dragEnd(): void {
    const dropped = drag.landed;
    const key = drag.from;
    drag.from = null;
    drag.over = null;
    drag.landed = false;

    if (!dropped && key) onremove(key);
  }

  /**
   * Keyboard parity for the two things the grip can do with a mouse. Foundry's keybindings listen
   * on the document, so a key acted on here has to stop there -- otherwise Delete would also delete
   * whatever tokens are selected behind the strip, and Alt+Arrow is history navigation in the
   * browser. Both are swallowed at the ends of a group too, where nothing moves.
   */
  function keydown(event: KeyboardEvent): void {
    if (event.key === "Delete" || event.key === "Backspace") {
      handled(event);
      onremove(attackKey);
      return;
    }

    if (!event.altKey) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    handled(event);
    onnudge(attackKey, event.key === "ArrowUp" ? -1 : 1);
  }

  function handled(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
</script>

<button
  type="button"
  draggable="true"
  data-hud-attack-handle={attackKey}
  title={t("weapons.handle", { name })}
  ondragstart={dragStart}
  ondragend={dragEnd}
  onkeydown={keydown}
  oncontextmenu={(event) => {
    event.preventDefault();
    onremove(attackKey);
  }}
  class="hud:flex hud:h-[14px] hud:w-[11px] hud:flex-none hud:cursor-grab hud:items-center hud:justify-center hud:text-hud-ink/25 hud:transition-colors hud:duration-75 hud:hover:text-hud-ink/60 hud:active:cursor-grabbing"
>
  <svg viewBox="0 0 12 12" width="9" height="9" fill="currentColor" aria-hidden="true">
    <circle cx="4" cy="2.5" r="1" />
    <circle cx="8" cy="2.5" r="1" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="8" cy="6" r="1" />
    <circle cx="4" cy="9.5" r="1" />
    <circle cx="8" cy="9.5" r="1" />
  </svg>
</button>
