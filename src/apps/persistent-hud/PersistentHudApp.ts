import { SvelteApp } from "@/apps/SvelteApp";
import { log } from "@/log";
import PersistentHud from "./PersistentHud.svelte";

const BODY_CLASS = "gurps-hud-active";
const HEIGHT_VAR = "--gurps-hud-height";
const BUCKET_ID = "bucket-container";

/**
 * PersistentHUD
 *
 * The always-mounted strip, docked to the bottom-left of the canvas.
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

  /** Where the modifier bucket lived before we adopted it, so closing the HUD can put it back. */
  #bucketHome: { parent: Node; next: Node | null } | null = null;
  #onBucketRender = () => this.#adoptBucket();

  component = () => PersistentHud;
  props = () => ({});

  protected override _insertElement(element: HTMLElement): void {
    /*
     * It anchors to `#interface` rather than to one of Foundry's flex regions. `#ui-bottom` -- the
     * obvious home, next to the hotbar -- lives inside `#ui-middle`, which is only 60% of the viewport
     * wide and centred, so nothing placed there can reach the left edge.
     */
    const anchor = document.getElementById("interface");

    if (anchor) {
      anchor.append(element);
    } else {
      log("#interface is missing; falling back to the document body");
      super._insertElement(element);
    }

    // The strip carries its own macro slots, so it stands in for the stock macro bar rather than
    // stacking on top of it. Toggling the HUD off puts the macro bar back.
    document.body.classList.add(BODY_CLASS);
    this.#watchHeight(element);

    // The Game Aid may render its bucket before or after us; cover both orders.
    this.#adoptBucket();
    Hooks.on("renderModifierBucket", this.#onBucketRender);
  }

  protected override async _onClose(options: object): Promise<void> {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    Hooks.off("renderModifierBucket", this.#onBucketRender);
    this.#releaseBucket();
    document.body.classList.remove(BODY_CLASS);
    document.body.style.removeProperty(HEIGHT_VAR);
    await super._onClose(options);
  }

  /**
   * Moves the Game Aid's modifier bucket into this element so it sits immediately to the right of
   * the strip. The Game Aid places the bucket by hand -- before `#hotbar` or at the top of
   * `#ui-right`, with inline margins it recomputes on every resize -- so following it around with
   * CSS is a losing game; owning the node is not.
   */
  #adoptBucket(): void {
    const bucket = document.getElementById(BUCKET_ID);
    if (!bucket || !this.element || bucket.parentElement === this.element) return;

    if (!this.#bucketHome && bucket.parentNode) {
      this.#bucketHome = { parent: bucket.parentNode, next: bucket.nextSibling };
    }
    this.element.append(bucket);
  }

  #releaseBucket(): void {
    const bucket = document.getElementById(BUCKET_ID);
    const home = this.#bucketHome;
    this.#bucketHome = null;
    if (!bucket || !home || bucket.parentElement !== this.element) return;

    if (home.next && home.next.parentNode === home.parent)
      home.parent.insertBefore(bucket, home.next);
    else home.parent.appendChild(bucket);
  }

  /**
   * Publishes the strip's height so the stylesheet can lift Foundry's player list clear of it. The
   * height is content-driven -- a weapon table grows with the actor -- so it has to be measured
   * rather than assumed.
   */
  #watchHeight(element: HTMLElement): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = new ResizeObserver(() => {
      document.body.style.setProperty(HEIGHT_VAR, `${element.offsetHeight}px`);
    });
    this.#resizeObserver.observe(element);
  }
}
