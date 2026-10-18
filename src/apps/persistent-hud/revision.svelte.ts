/**
 * Foundry mutates its documents in place, so there is nothing for Svelte to subscribe to. Every hook
 * that could change what the strip shows bumps one of these, and whatever was derived through it
 * recomputes.
 */
export class Revision {
  #value = $state(0);

  bump(): void {
    this.#value++;
  }

  /** Makes the revision an explicit input of a read, so bumping it re-runs the derivation. */
  read<T>(read: () => T): T {
    void this.#value;
    return read();
  }
}
