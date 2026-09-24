import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, test } from "vitest";

import Popover from "./Popover.svelte";

const children = createRawSnippet(() => ({ render: () => `<span>panel body</span>` }));

/** The panel itself, as opposed to the transparent bridge rendered alongside it. */
const panelOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-hud-popover]");

describe("Popover", () => {
  it("renders its content", () => {
    render(Popover, { children });

    expect(screen.getByText("panel body")).toBeTruthy();
  });

  it("takes extra classes from the caller, which owns the body's own layout", () => {
    const { container } = render(Popover, { class: "hud:w-[124px] hud:flex-col", children });

    expect(panelOf(container)?.className).toContain("hud:w-[124px]");
  });

  /*
   * The panel floats clear of its trigger, so the pointer crosses a gap where it is over neither.
   * The wrapper's `mouseleave` fires there and starts the dismiss timer -- and for the posture
   * badge the gap spans the character-name trigger, which takes the hover and swaps the panel. The
   * bridge fills that gap so the pointer never leaves the trigger's subtree. Where the panel lands,
   * and so how tall the bridge is, only a browser can say: see `e2e/popover-placement.spec.ts`.
   */
  it("bridges the gap between itself and its trigger", () => {
    const { container } = render(Popover, { children });

    expect(container.querySelector("[data-hud-popover-bridge]")).toBeTruthy();
  });

  it("hides the bridge from the accessibility tree, since it is only a hover target", () => {
    const { container } = render(Popover, { children });

    expect(container.querySelector("[data-hud-popover-bridge]")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  test("named for the browser suites to wait on", () => {
    render(Popover, { name: "maneuver", children });

    expect(document.querySelector('[data-hud-panel="maneuver"]')).toBeTruthy();
  });

  it("has no panel hook when unnamed, so a stale selector cannot match it", () => {
    render(Popover, { children });

    expect(document.querySelector("[data-hud-panel]")).toBeNull();
  });
});
