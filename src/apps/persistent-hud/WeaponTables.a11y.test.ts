import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import { fixtureView } from "./hud-fixture";
import WeaponTables from "./WeaponTables.svelte";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS: string[] = [];

describe("WeaponTables accessibility", () => {
  it("has no violations", async () => {
    const { container } = render(WeaponTables, { view: fixtureView(), onroll: vi.fn() });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS);
  });
});
