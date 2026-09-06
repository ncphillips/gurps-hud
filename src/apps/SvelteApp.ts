import { mount, unmount } from "svelte";
import type { Component } from "svelte";

const AppV2 = foundry.applications.api.ApplicationV2;

/**
 * Bridges Svelte 5 into Foundry's ApplicationV2 lifecycle: Foundry owns the window
 * frame and positioning, Svelte owns everything inside `.window-content`.
 */
export abstract class SvelteApp extends AppV2 {
  #instance: Record<string, unknown> | null = null;

  // Subclasses return concrete components with their own prop types; `any` is the
  // only bridge that lets the base class stay agnostic about them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract component(): Component<any>;
  abstract props(): Record<string, unknown>;

  override _renderHTML(): Promise<string> {
    return Promise.resolve("");
  }

  override _replaceHTML(_result: string, content: HTMLElement): void {
    content.innerHTML = "";
  }

  override async _onRender(_context: object, _options: object): Promise<void> {
    this.#destroy();
    const target = this.element.querySelector<HTMLElement>(".window-content") ?? this.element;
    this.#instance = mount(this.component(), { target, props: this.props() });
  }

  protected override async _onClose(_options: object): Promise<void> {
    this.#destroy();
  }

  toggle(): void {
    if (this.rendered) void this.close();
    else void this.render({ force: true });
  }

  #destroy(): void {
    if (!this.#instance) return;
    unmount(this.#instance);
    this.#instance = null;
  }
}
