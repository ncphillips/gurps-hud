import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import { emptyHudView } from "@/gurps/hud-view";
import { fixtureView } from "./hud-fixture";
import WeaponTables from "./WeaponTables.svelte";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = { rows: [] as string[], nothingSelected: [] as string[] };

describe("WeaponTables accessibility", () => {
  it("has no violations", async () => {
    const { container } = render(WeaponTables, {
      view: fixtureView(),
      enabled: true,
      onroll: vi.fn(),
    });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.rows);
  });

  test("nothing selected", async () => {
    const { container } = render(WeaponTables, {
      view: emptyHudView(),
      enabled: false,
      onroll: vi.fn(),
    });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.nothingSelected);
  });
});
