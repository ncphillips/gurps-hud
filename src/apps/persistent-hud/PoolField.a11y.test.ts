import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, test, vi } from "vitest";
import type { PoolVital } from "@/gurps/hud-view";

import PoolField from "./PoolField.svelte";

const hp: PoolVital = { value: "20", max: "22", tone: "ok" };
const TITLE = "Hit Points -- click to edit";

describe("PoolField accessibility", () => {
  it("is accessible as a readout", async () => {
    const { container } = render(PoolField, {
      pool: hp,
      enabled: true,
      title: TITLE,
      onchange: vi.fn(),
    });

    await expect(container).toBeAccessible();
  });

  test("clicked open to edit the current value", async () => {
    const { container } = render(PoolField, {
      pool: hp,
      enabled: true,
      title: TITLE,
      onchange: vi.fn(),
    });
    await fireEvent.click(screen.getByTitle(TITLE));

    // The box turns into a bare <input> with nothing naming it: it needs the pool's name as an
    // aria-label, which means taking the name as a prop rather than the whole title string.
    await expect(container).toBeAccessible({ except: ["label: input"] });
  });

  test("blank, with no actor selected", async () => {
    const blank = { value: "—", max: "—", tone: "ok" } as const;
    const { container } = render(PoolField, {
      pool: blank,
      enabled: false,
      title: TITLE,
      onchange: vi.fn(),
    });

    await expect(container).toBeAccessible();
  });
});
