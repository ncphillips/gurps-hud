import { render } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import { noPicks } from "@/gurps/attack-picks";
import { emptyHudView } from "@/gurps/hud-view";
import { attackDrag } from "./attack-drag";
import { fixtureView } from "./hud-fixture";
import WeaponTables from "./WeaponTables.svelte";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = {
  rows: [] as string[],
  nothingPicked: [] as string[],
  nothingSelected: [] as string[],
};

function props(
  overrides: Partial<ComponentProps<typeof WeaponTables>> = {},
): ComponentProps<typeof WeaponTables> {
  return {
    view: fixtureView(),
    enabled: true,
    actorId: "actor-brent",
    drag: attackDrag(),
    onroll: vi.fn(),
    onplace: vi.fn(),
    onremove: vi.fn(),
    onnudge: vi.fn(),
    onpickall: vi.fn(),
    ...overrides,
  };
}

describe("WeaponTables accessibility", () => {
  it("has no violations", async () => {
    const { container } = render(WeaponTables, props());

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.rows);
  });

  test("an actor whose attacks have not been picked yet", async () => {
    const { container } = render(WeaponTables, props({ view: fixtureView(noPicks()) }));

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.nothingPicked);
  });

  test("nothing selected", async () => {
    const { container } = render(
      WeaponTables,
      props({ view: emptyHudView(), enabled: false, actorId: null }),
    );

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.nothingSelected);
  });
});
