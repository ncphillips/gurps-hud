import { render } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, it, test, vi } from "vitest";
import { noPicks } from "@/gurps/attack-picks";
import { emptyHudView } from "@/gurps/hud-view";
import { attackDrag } from "./attack-drag";
import { fixtureView } from "./hud-fixture";
import WeaponTables from "./WeaponTables.svelte";

function props(
  overrides: Partial<ComponentProps<typeof WeaponTables>> = {},
): ComponentProps<typeof WeaponTables> {
  return {
    view: fixtureView(),
    enabled: true,
    actorId: "actor-thor",
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
  it("is accessible", async () => {
    const { container } = render(WeaponTables, props());

    await expect(container).toBeAccessible();
  });

  test("an actor whose attacks have not been picked yet", async () => {
    const { container } = render(WeaponTables, props({ view: fixtureView(noPicks()) }));

    await expect(container).toBeAccessible();
  });

  test("nothing selected", async () => {
    const { container } = render(
      WeaponTables,
      props({ view: emptyHudView(), enabled: false, actorId: null }),
    );

    await expect(container).toBeAccessible();
  });
});
