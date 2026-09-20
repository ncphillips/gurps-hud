import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { maneuverById } from "@/gurps/maneuvers";
import { emptyHudView } from "@/gurps/hud-view";
import { fixtureTargetView, fixtureView } from "./hud-fixture";
import TopBar from "./TopBar.svelte";
import type { Panel } from "./panels";

function props(openPanel: Panel | null = null) {
  return {
    view: fixtureView(),
    enabled: true,
    maneuver: maneuverById("attack") ?? null,
    maneuverEnabled: true,
    openPanel,
    onopen: vi.fn(),
    onclose: vi.fn(),
    onselect: vi.fn(),
    targetView: fixtureTargetView(),
    target: "Torso",
    onselecttarget: vi.fn(),
    onroll: vi.fn(),
  };
}

describe("TopBar accessibility", () => {
  it("is accessible with every panel closed", async () => {
    const { container } = render(TopBar, { props: props() });

    await expect(container).toBeAccessible();
  });

  test("the attributes panel open", async () => {
    const { container } = render(TopBar, { props: props("attrs") });

    await expect(container).toBeAccessible();
  });

  test("the skills panel open", async () => {
    const { container } = render(TopBar, { props: props("skills") });

    await expect(container).toBeAccessible();
  });

  test("the maneuver panel open", async () => {
    const { container } = render(TopBar, { props: props("maneuver") });

    await expect(container).toBeAccessible();
  });

  test("the target's hit locations open", async () => {
    const { container } = render(TopBar, { props: props("target") });

    await expect(container).toBeAccessible();
  });

  test("no token targeted, so the target pill is inert", async () => {
    const { container } = render(TopBar, { props: { ...props(), targetView: null } });

    await expect(container).toBeAccessible();
  });

  test("nothing selected", async () => {
    const { container } = render(TopBar, {
      props: { ...props(), view: emptyHudView(), enabled: false, maneuverEnabled: false },
    });

    await expect(container).toBeAccessible();
  });
});
