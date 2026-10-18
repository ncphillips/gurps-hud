import {
  assignMacroSlot,
  changeHotbarPage,
  executeMacroSlot,
  hotbarPage,
  hotbarPages,
  moveMacroSlot,
  removeMacroSlot,
} from "@/gurps/game-aid";
import { currentHotbarMode, showsHudHotbar } from "@/settings";
import type { Revision } from "./revision.svelte";

export class MacroBarState {
  #revision: Revision;

  constructor(revision: Revision) {
    this.#revision = revision;
  }

  // `$derived.by` rather than `$derived` throughout. Svelte defers either form until first read, but
  // TypeScript sees a bare `this.#revision` in a field initialiser, which runs before the
  // constructor assigns it, and refuses it (TS2729).
  pages = $derived.by(() => this.#revision.read(hotbarPages));

  /**
   * Which hotbar page the footer shows. Read back from Foundry rather than kept alongside it: a
   * private copy only stays right for as long as the HUD is the only thing that ever changes the
   * page, and when a macro or another module changes it the footer and the number keys would
   * silently disagree about which ten slots are live. Foundry's `changePage` announces itself through
   * no hook we watch, so ours bumps the revision itself after asking for the change.
   */
  page = $derived.by(() => this.#revision.read(hotbarPage));

  /**
   * Whether the strip draws a macro footer at all. A reader who has kept Foundry's own hotbar has
   * one already, and two bars over the same fifty slots is a bar too many.
   */
  visible = $derived.by(() => this.#revision.read(() => showsHudHotbar(currentHotbarMode())));

  changePage = (page: number): void => {
    changeHotbarPage(page);
    this.#revision.bump();
  };

  /** Spread onto `MacroBar`, which stays a plain presentational component. */
  props = $derived({
    pages: this.pages,
    page: this.page,
    onpage: this.changePage,
    onexecute: executeMacroSlot,
    onassign: (slot: number, event: DragEvent) => void assignMacroSlot(slot, event),
    onmove: (from: number, to: number) => void moveMacroSlot(from, to),
    onremove: (slot: number) => void removeMacroSlot(slot),
  });
}
