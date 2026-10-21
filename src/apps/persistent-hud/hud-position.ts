import type { HudPosition } from "@/settings";

interface Size {
  width: number;
  height: number;
}

/**
 * The nearest spot to `position` that keeps the whole HUD on screen, in whole pixels. A HUD bigger
 * than the screen keeps its left and bottom edges on it, since that is where the grip is.
 */
export function keepOnScreen(position: HudPosition, hud: Size, screen: Size): HudPosition {
  // The room is floored, not rounded: a strip is a fractional width wide, and rounding it up would
  // hang its last fraction of a pixel off the edge.
  const within = (value: number, room: number) =>
    Math.max(0, Math.min(Math.round(value), Math.floor(room)));

  return {
    left: within(position.left, screen.width - hud.width),
    bottom: within(position.bottom, screen.height - hud.height),
  };
}

/** How close to the corner a drop has to land to count as putting the strip back. */
const DOCK_REACH = 24;

/**
 * `null` -- docked -- for a spot dropped close enough to the corner the strip docks in. Docked is
 * not just that corner: it is what lifts Foundry's player list clear of the strip, and a strip
 * parked a few pixels off it would sit on top of the list instead.
 */
export function dockedNear(position: HudPosition): HudPosition | null {
  return position.left <= DOCK_REACH && position.bottom <= DOCK_REACH ? null : position;
}

/**
 * Pins the HUD's element to `position`, kept on screen, and returns the spot it landed on; `null`
 * hands it back to the stylesheet, which docks it. `fixed` rather than the stylesheet's `absolute`
 * so the same numbers mean the same spot in a world, where the element sits in `#interface`, and
 * in the harness, where it sits in the body's flow.
 */
export function placeHud(host: HTMLElement, position: HudPosition | null): HudPosition | null {
  if (!position) {
    for (const property of ["position", "left", "bottom", "top"])
      host.style.removeProperty(property);
    return null;
  }

  // Measured once pinned: in the harness's flow the docked element is as wide as the page.
  const pin = (spot: HudPosition) =>
    Object.assign(host.style, {
      position: "fixed",
      left: `${spot.left}px`,
      bottom: `${spot.bottom}px`,
      top: "auto",
    });
  pin(position);

  const onScreen = keepOnScreen(position, host.getBoundingClientRect(), {
    width: innerWidth,
    height: innerHeight,
  });
  pin(onScreen);
  return onScreen;
}
