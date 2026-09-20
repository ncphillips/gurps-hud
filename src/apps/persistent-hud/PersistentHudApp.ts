import { SvelteApp } from "@/apps/SvelteApp";
import { log } from "@/log";
import { currentHotbarMode, HOTBAR_MODE_HOOK, showsDefaultHotbar } from "@/settings";
import PersistentHud from "./PersistentHud.svelte";

const BODY_CLASS = "gurps-hud-active";

/** Carried only while the strip's footer is standing in for Foundry's bar; the stylesheet hides it. */
const OWNS_HOTBAR_CLASS = "gurps-hud-owns-hotbar";
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
  #onHotbarMode = () => this.#followHotbarMode();

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

    document.body.classList.add(BODY_CLASS);
    this.#watchHeight(element);

    // The Game Aid may render its bucket before or after us; cover both orders.
    this.#followHotbarMode();
    Hooks.on("renderModifierBucket", this.#onBucketRender);
    Hooks.on(HOTBAR_MODE_HOOK, this.#onHotbarMode);
  }

  /**
   * Both halves of the reader's hotbar choice, applied to Foundry's own furniture.
   *
   * The strip carries its own macro slots, so by default it stands in for the stock bar rather than
   * stacking on top of it -- and the Game Aid's modifier bucket, which the stock bar is otherwise
   * the anchor for, comes with it. A reader who kept the stock bar keeps both: the bar, and the
   * bucket beside it where the system parks it.
   */
  #followHotbarMode(): void {
    const keepsDefault = showsDefaultHotbar(currentHotbarMode());

    document.body.classList.toggle(OWNS_HOTBAR_CLASS, !keepsDefault);
    if (keepsDefault) this.#releaseBucket();
    else this.#adoptBucket();
  }

  protected override async _onClose(options: object): Promise<void> {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    Hooks.off("renderModifierBucket", this.#onBucketRender);
    Hooks.off(HOTBAR_MODE_HOOK, this.#onHotbarMode);
    this.#releaseBucket();
    document.body.classList.remove(BODY_CLASS);
    document.body.classList.remove(OWNS_HOTBAR_CLASS);
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
    // Also the guard for `renderModifierBucket`: the Game Aid re-renders the bucket on every roll,
    // and each of those would otherwise pull it back out of the stock bar it was left beside.
    if (showsDefaultHotbar(currentHotbarMode())) return;

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
