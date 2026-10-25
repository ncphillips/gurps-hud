import { render } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { emptyHudView } from "@/gurps/hud-view";
import { fixtureActor, fixtureView } from "./hud-fixture";
import PortraitBlock from "./PortraitBlock.svelte";
import type { Panel } from "./panels";

function props(openPanel: Panel | null = null) {
  const actor = fixtureActor();
  const other = { ...fixtureActor(), id: "actor-goblin", name: "Goblin Grunt" };

  return {
    view: fixtureView(),
    enabled: true,
    actor,
    onpool: vi.fn(),
    onopensheet: vi.fn(),
    locked: false,
    ontogglelock: vi.fn(),
    choices: [
      { key: "t-thor", name: actor.name, img: null, actor },
      { key: "t-goblin", name: other.name, img: null, actor: other },
    ],
    onselectactor: vi.fn(),
    openPanel,
    onposture: vi.fn(),
    onshock: vi.fn(),
    onopen: vi.fn(),
    onclose: vi.fn(),
    onminimize: vi.fn(),
  };
}

describe("PortraitBlock accessibility", () => {
  it("is accessible with every menu closed", async () => {
    const { container } = render(PortraitBlock, props());

    await expect(container).toBeAccessible();
  });

  test("the character switcher open", async () => {
    const { container } = render(PortraitBlock, props("actor"));

    await expect(container).toBeAccessible();
  });

  test("the posture menu open", async () => {
    const { container } = render(PortraitBlock, props("posture"));

    await expect(container).toBeAccessible();
  });

  test("the shock menu open", async () => {
    const { container } = render(PortraitBlock, props("shock"));

    await expect(container).toBeAccessible();
  });

  test("locked to its character", async () => {
    const { container } = render(PortraitBlock, { ...props(), locked: true });

    await expect(container).toBeAccessible();
  });

  test("reeling and exhausted", async () => {
    const condition = {
      label: "RLNG+TIRED",
      tone: "danger" as const,
      title: "Reeling and Exhausted",
    };
    const { container } = render(PortraitBlock, {
      ...props(),
      view: { ...fixtureView(), condition },
    });

    await expect(container).toBeAccessible();
  });

  test("reeling and exhausted with Quintessence Points", async () => {
    const condition = {
      label: "RLNG+TIRED",
      tone: "danger" as const,
      title: "Reeling and Exhausted",
    };
    const qp = { value: "7", max: "10", tone: "ok" as const };
    const { container } = render(PortraitBlock, {
      ...props(),
      view: { ...fixtureView(), condition, qp },
    });

    await expect(container).toBeAccessible();
  });

  test("with Quintessence Points", async () => {
    const qp = { value: "7", max: "10", tone: "ok" as const };
    const { container } = render(PortraitBlock, { ...props(), view: { ...fixtureView(), qp } });

    await expect(container).toBeAccessible();
  });

  test("nothing selected", async () => {
    const { container } = render(PortraitBlock, {
      ...props(),
      view: emptyHudView(),
      enabled: false,
      actor: null,
    });

    await expect(container).toBeAccessible();
  });
});
