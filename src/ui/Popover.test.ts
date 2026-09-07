import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, test } from "vitest";

import Popover from "./Popover.svelte";

const children = createRawSnippet(() => ({ render: () => `<span>panel body</span>` }));

/** The panel itself, as opposed to the transparent bridge rendered alongside it. */
const panelOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".bg-hud-popover");

describe("Popover", () => {
  it("renders its content", () => {
    render(Popover, { children });

    expect(screen.getByText("panel body")).toBeTruthy();
  });

  it("sits the given distance above the trigger", () => {
    const { container } = render(Popover, { offset: 30, children });

    expect(panelOf(container)?.getAttribute("style")).toContain("calc(100% + 30px)");
  });

  it("aligns to the left edge of the trigger by default", () => {
    const { container } = render(Popover, { children });

    expect(panelOf(container)?.className).toContain("left-0");
  });

  test("aligned to the right", () => {
    const { container } = render(Popover, { align: "right", children });

    expect(panelOf(container)?.className).toContain("right-0");
  });

  it("takes extra classes from the caller, which owns the body's own layout", () => {
    const { container } = render(Popover, { class: "w-[124px] flex-col", children });

    expect(panelOf(container)?.className).toContain("w-[124px]");
  });

  /*
   * The panel floats clear of its trigger, so the pointer crosses a gap where it is over neither.
   * The wrapper's `mouseleave` fires there and starts the dismiss timer -- and for the posture
   * badge the gap spans the character-name trigger, which takes the hover and swaps the panel. The
   * bridge fills that gap so the pointer never leaves the trigger's subtree.
   */
  it("bridges the gap between itself and its trigger", () => {
    const { container } = render(Popover, { offset: 30, children });

    expect(container.querySelector("[data-hud-popover-bridge]")).toBeTruthy();
  });

  it("makes the bridge exactly as tall as the gap it has to cover", () => {
    const { container } = render(Popover, { offset: 30, children });

    expect(container.querySelector("[data-hud-popover-bridge]")?.getAttribute("style")).toContain(
      "30px",
    );
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
