import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, test } from "vitest";

import Readout from "./Readout.svelte";
import { READOUT, READOUT_TEXT } from "./readout";

const children = createRawSnippet(() => ({ render: () => `<span>20</span>` }));

describe("Readout", () => {
  it("renders its value", () => {
    render(Readout, { children });

    expect(screen.getByText("20")).toBeTruthy();
  });

  it("carries the shared geometry, which is what keeps the vitals grid aligned", () => {
    const { container } = render(Readout, { children });

    expect(container.querySelector("span")?.className).toContain(READOUT);
  });

  it("takes a tone class from the caller, which knows what the number means", () => {
    const { container } = render(Readout, { class: "hud:text-hud-accent", children });

    expect(container.querySelector("span")?.className).toContain("hud:text-hud-accent");
  });

  it("reads at the grid's size by default", () => {
    const { container } = render(Readout, { children });

    expect(container.querySelector("span")?.className).toContain(READOUT_TEXT.md);
  });

  /*
   * A size prop rather than a class the caller overrides: both sizes are arbitrary Tailwind text
   * utilities, so which one wins is decided by their order in the generated stylesheet, not by
   * their order in the class string. Appending would work by luck.
   */
  test("small, for a condition label too long to fit at the grid's size", () => {
    const { container } = render(Readout, { size: "sm", children });

    expect(container.querySelector("span")?.className).not.toContain(READOUT_TEXT.md);
  });

  test("titled, so the grid's terse numbers can explain themselves", () => {
    render(Readout, { title: "Shock penalty to DX and IQ", children });

    expect(screen.getByTitle("Shock penalty to DX and IQ")).toBeTruthy();
  });
});

/*
 * The one Tier 1 primitive that is a class rather than a component: PoolField puts this geometry on
 * an <input> and a <button> so the box cannot move when it turns editable, and neither of those is
 * a <span> Readout could render.
 */
describe("READOUT", () => {
  it("fixes the box's width so a wider number cannot widen it", () => {
    expect(READOUT).toContain("hud:flex-1");
  });

  it("right-aligns, so digits line up down the vitals column", () => {
    expect(READOUT).toContain("hud:text-right");
  });
});
