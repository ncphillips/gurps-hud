import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import { maneuverById } from "@/gurps/maneuvers";
import { emptyHudView } from "@/gurps/hud-view";
import { fixtureTargetView, fixtureView } from "./hud-fixture";
import TopBar from "./TopBar.svelte";
import type { Panel } from "./panels";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = {
  closed: [] as string[],
  attrs: [] as string[],
  skills: [] as string[],
  maneuver: [] as string[],
  target: [] as string[],
  untargeted: [] as string[],
  noActor: [] as string[],
};

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
  it("has no violations with every panel closed", async () => {
    const { container } = render(TopBar, { props: props() });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.closed);
  });

  test("the attributes panel open", async () => {
    const { container } = render(TopBar, { props: props("attrs") });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.attrs);
  });

  test("the skills panel open", async () => {
    const { container } = render(TopBar, { props: props("skills") });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.skills);
  });

  test("the maneuver panel open", async () => {
    const { container } = render(TopBar, { props: props("maneuver") });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.maneuver);
  });

  test("the target's hit locations open", async () => {
    const { container } = render(TopBar, { props: props("target") });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.target);
  });

  test("no token targeted, so the target pill is inert", async () => {
    const { container } = render(TopBar, { props: { ...props(), targetView: null } });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.untargeted);
  });

  test("nothing selected", async () => {
    const { container } = render(TopBar, {
      props: { ...props(), view: emptyHudView(), enabled: false, maneuverEnabled: false },
    });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.noActor);
  });
});
