import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { fixtureView } from "./hud-fixture";
import SpellsPanel from "./SpellsPanel.svelte";

describe("SpellsPanel", () => {
  it("lists every spell on the actor", () => {
    render(SpellsPanel, { spells: fixtureView().spells, onroll: vi.fn() });

    expect(screen.getByText("Lightning")).toBeTruthy();
  });

  it("shows what casting a spell costs", () => {
    render(SpellsPanel, { spells: fixtureView().spells, onroll: vi.fn() });

    expect(screen.getByRole("button", { name: /Lightning/ }).textContent).toContain("1 to 3");
  });

  test("clicking a spell", async () => {
    const onroll = vi.fn();
    render(SpellsPanel, { spells: fixtureView().spells, onroll });

    await fireEvent.click(screen.getByTitle("Cast Lightning"));

    expect(onroll).toHaveBeenCalledWith('Sp:"Lightning"', expect.anything());
  });

  test("a college has nothing to cast", () => {
    render(SpellsPanel, { spells: fixtureView().spells, onroll: vi.fn() });

    expect(screen.queryByTitle("Cast Air")).toBeNull();
  });
});
