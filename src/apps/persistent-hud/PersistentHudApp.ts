import { SvelteApp } from "@/apps/SvelteApp";
import { log } from "@/log";
import PersistentHud from "./PersistentHud.svelte";

const BODY_CLASS = "gurps-hud-active";
const HEIGHT_VAR = "--gurps-hud-height";

/**
 * The always-mounted strip, docked to the bottom-left of the canvas.
 *
 * It anchors to `#interface` rather than to one of Foundry's flex regions. `#ui-bottom` -- the
 * obvious home, next to the hotbar -- lives inside `#ui-middle`, which is only 60% of the viewport
 * wide and centred, so nothing placed there can reach the left edge. `#ui-bottom` also centres its
 * children, and the Game Aid's modifier bucket appends itself to `#ui-bottom > div`, which would
 * have found this element instead.
 */
export class PersistentHudApp extends SvelteApp {
  static override DEFAULT_OPTIONS = {
    id: "gurps-hud-persistent",
    classes: ["gurps-hud", "gurps-hud-persistent"],
    window: {
      frame: false,
      positioned: false,
      minimizable: false,
      resizable: false,
    },
  };

  #resizeObserver: ResizeObserver | null = null;

  component = () => PersistentHud;
  props = () => ({});

  protected override _insertElement(element: HTMLElement): void {
    const anchor = document.getElementById("interface");

    if (anchor) anchor.append(element);
    else {
      log("#interface is missing; falling back to the document body");
      super._insertElement(element);
    }

    // The strip carries its own macro slots, so it stands in for the stock macro bar rather than
    // stacking on top of it. Toggling the HUD off puts the macro bar back.
    document.body.classList.add(BODY_CLASS);
    this.#watchHeight(element);
  }

  protected override async _onClose(options: object): Promise<void> {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    document.body.classList.remove(BODY_CLASS);
    document.body.style.removeProperty(HEIGHT_VAR);
    await super._onClose(options);
  }

  /**
   * Publishes the strip's height so the stylesheet can lift Foundry's player list and the Game Aid's
   * modifier bucket clear of it. The height is content-driven -- a weapon table grows with the actor
   * -- so it has to be measured rather than assumed.
   */
  #watchHeight(element: HTMLElement): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = new ResizeObserver(() => {
      document.body.style.setProperty(HEIGHT_VAR, `${element.offsetHeight}px`);
    });
    this.#resizeObserver.observe(element);
  }
}
