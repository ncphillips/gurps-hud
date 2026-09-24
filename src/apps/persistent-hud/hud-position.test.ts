import { describe, expect, it, test } from "vitest";
import { keepOnScreen } from "./hud-position";

const HUD = { width: 600, height: 200 };
const SCREEN = { width: 1280, height: 720 };

describe("keepOnScreen", () => {
  it("leaves a position already on screen where it is", () => {
    expect(keepOnScreen({ left: 100, bottom: 50 }, HUD, SCREEN)).toEqual({ left: 100, bottom: 50 });
  });

  test("dragged past the right edge", () => {
    expect(keepOnScreen({ left: 900, bottom: 50 }, HUD, SCREEN).left).toBe(680);
  });

  test("dragged past the left edge", () => {
    expect(keepOnScreen({ left: -40, bottom: 50 }, HUD, SCREEN).left).toBe(0);
  });

  test("dragged past the top", () => {
    expect(keepOnScreen({ left: 100, bottom: 600 }, HUD, SCREEN).bottom).toBe(520);
  });

  test("dragged past the bottom", () => {
    expect(keepOnScreen({ left: 100, bottom: -40 }, HUD, SCREEN).bottom).toBe(0);
  });

  /* A HUD wider than the window has nowhere to go, so the grip on its left edge wins. */
  test("a HUD wider than the screen", () => {
    expect(keepOnScreen({ left: 100, bottom: 50 }, { width: 1400, height: 200 }, SCREEN).left).toBe(
      0,
    );
  });

  test("dragged past the right edge of a strip a fractional width wide", () => {
    expect(
      keepOnScreen({ left: 900, bottom: 50 }, { width: 600.5, height: 200 }, SCREEN).left,
    ).toBe(679);
  });

  /* Pointer deltas are fractional under a UI scale; the stored spot is not. */
  test("a fractional position", () => {
    expect(keepOnScreen({ left: 100.6, bottom: 50.2 }, HUD, SCREEN)).toEqual({
      left: 101,
      bottom: 50,
    });
  });
});
