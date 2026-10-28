import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, test, vi } from "vitest";
import AttackNotes from "./AttackNotes.svelte";

/** Stands in for the Game Aid's `gurpslink`, which turns `[label/otf]` into a link span. */
function gurpslink(str: string): string {
  return str.replace(/\['([^']+)'([^\]]+)\]/g, `<span class='gurpslink' data-otf='$2'>$1</span>`);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AttackNotes", () => {
  it("rolls a note's OtF button when clicked", async () => {
    vi.stubGlobal("GURPS", { gurpslink });
    const onroll = vi.fn();
    render(AttackNotes, { notes: "Swish ['Swing!'/anim slash]", onroll });

    await fireEvent.click(screen.getByRole("button", { name: "Swing!" }));

    expect(onroll).toHaveBeenCalledWith("/anim slash", expect.any(MouseEvent));
  });

  test("notes without the Game Aid loaded", () => {
    render(AttackNotes, { notes: "Swish ['Swing!'/anim slash]", onroll: vi.fn() });

    expect(screen.queryByRole("button")).toBeNull();
  });

  test("an attack with no notes", () => {
    const { container } = render(AttackNotes, { notes: "", onroll: vi.fn() });

    expect(container.querySelector("[data-hud-attack-notes]")).toBeNull();
  });
});
