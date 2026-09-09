import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import { axeViolations } from "@/a11y-scan";
import type { PoolVital } from "@/gurps/hud-view";

import PoolField from "./PoolField.svelte";

/** Known violations, i.e. this component's accessibility to-do list. */
const EXCEPTIONS = {
  readout: [] as string[],
  blank: [] as string[],
  // The box turns into a bare <input> with nothing naming it: it needs the pool's name as an
  // aria-label, which means taking the name as a prop rather than the whole title string.
  editing: ["label: input"],
};

const hp: PoolVital = { value: "20", max: "22", tone: "ok" };
const TITLE = "Hit Points -- click to edit";

describe("PoolField accessibility", () => {
  it("has no violations as a readout", async () => {
    const { container } = render(PoolField, {
      pool: hp,
      enabled: true,
      title: TITLE,
      onchange: vi.fn(),
    });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.readout);
  });

  test("clicked open to edit the current value", async () => {
    const { container } = render(PoolField, {
      pool: hp,
      enabled: true,
      title: TITLE,
      onchange: vi.fn(),
    });
    await fireEvent.click(screen.getByTitle(TITLE));

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.editing);
  });

  test("blank, with no actor selected", async () => {
    const blank = { value: "—", max: "—", tone: "ok" } as const;
    const { container } = render(PoolField, {
      pool: blank,
      enabled: false,
      title: TITLE,
      onchange: vi.fn(),
    });

    expect(await axeViolations(container)).toEqual(EXCEPTIONS.blank);
  });
});
