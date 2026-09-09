/**
 * Foundry's hook bus, as much of it as the harness needs. The HUD subscribes on mount and expects
 * something to announce every change; here that something is the harness itself, so anything it
 * does to an actor -- a posture, a maneuver, an edited pool -- rerenders the strip the way a world
 * would.
 */

const subscribers = new Map<string, Array<() => void>>();

export function fire(hook: string): void {
  for (const subscriber of subscribers.get(hook) ?? []) subscriber();
}

export const hooksStub = {
  on: (hook: string, fn: () => void) =>
    subscribers.set(hook, [...(subscribers.get(hook) ?? []), fn]),
  // The harness never unmounts the strip, so nothing ever needs unsubscribing.
  off: () => undefined,
};
