import { fireEvent, render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { describe, expect, it, test, vi } from "vitest";
import PoolField from "./PoolField.svelte";

type PoolFieldProps = ComponentProps<typeof PoolField>;

const TITLE = "Hit Points -- click to edit";

/** Thor at 20 of 22, which is the pool every test here starts from. */
function props(overrides: Partial<PoolFieldProps> = {}): PoolFieldProps {
  return {
    pool: { value: "20", max: "22", tone: "ok" },
    enabled: true,
    title: TITLE,
    onchange: vi.fn(),
    ...overrides,
  };
}

/** The box once it has been clicked open: a bare text input in place of the readout. */
function box(): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>("input");
  if (!element) throw new Error("the pool is not open for editing");
  return element;
}

async function open(): Promise<HTMLInputElement> {
  await fireEvent.click(screen.getByTitle(TITLE));
  return box();
}

/** Types over whatever the box was showing, the way selecting the value and typing does. */
async function type(text: string): Promise<void> {
  await fireEvent.input(box(), { target: { value: text } });
}

describe("PoolField", () => {
  it("opens for editing when the readout is clicked", async () => {
    render(PoolField, props());

    await open();

    expect(box().value).toBe("20");
  });

  it("reports the new value on Enter", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await type("14");
    await fireEvent.keyDown(box(), { key: "Enter" });

    expect(onchange).toHaveBeenCalledWith(14);
  });

  /* The common case: a player who has just been hit types the damage rather than the arithmetic. */
  it("applies a signed entry as a delta", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await type("-3");
    await fireEvent.keyDown(box(), { key: "Enter" });

    expect(onchange).toHaveBeenCalledWith(17);
  });

  it("commits when the box loses focus, since clicking away is how an edit usually ends", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await type("14");
    await fireEvent.blur(box());

    expect(onchange).toHaveBeenCalledWith(14);
  });

  it("closes the box once the edit is committed", async () => {
    render(PoolField, props());

    await open();
    await fireEvent.keyDown(box(), { key: "Enter" });

    expect(screen.getByTitle(TITLE)).toBeTruthy();
  });

  test("Escape, after typing a value", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await type("14");
    await fireEvent.keyDown(box(), { key: "Escape" });

    expect(onchange).not.toHaveBeenCalled();
  });

  test("an entry the pool already has", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await fireEvent.keyDown(box(), { key: "Enter" });

    expect(onchange).not.toHaveBeenCalled();
  });

  test("an entry that is not a number", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await type("lots");
    await fireEvent.keyDown(box(), { key: "Enter" });

    expect(onchange).not.toHaveBeenCalled();
  });

  /*
   * Enter is what commits, so the arrows only move the draft -- a GM walking a mook down to zero
   * can hold one key and let go once, rather than writing to the actor on every press.
   */
  it("steps the draft without committing it while the box is open", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await fireEvent.keyDown(box(), { key: "ArrowDown" });

    expect(onchange).not.toHaveBeenCalled();
  });

  it("commits what the arrows stepped the draft to", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await open();
    await fireEvent.keyDown(box(), { key: "ArrowDown" });
    await fireEvent.keyDown(box(), { key: "Enter" });

    expect(onchange).toHaveBeenCalledWith(19);
  });

  /* On the closed box there is no draft to hold, so an arrow is the whole edit. */
  it("changes the actor straight away when an arrow is pressed on the closed box", async () => {
    const onchange = vi.fn();
    render(PoolField, props({ onchange }));

    await fireEvent.keyDown(screen.getByTitle(TITLE), { key: "ArrowUp" });

    expect(onchange).toHaveBeenCalledWith(21);
  });
});

describe("PoolField with no actor", () => {
  /* The readout is a plain span rather than a button, so there is nothing to click open. */
  test("clicking the blank readout", async () => {
    const { container } = render(
      PoolField,
      props({ pool: { value: "—", max: "—", tone: "ok" }, enabled: false }),
    );

    await fireEvent.click(container.querySelector("span")!);

    expect(container.querySelector("input")).toBeNull();
  });
});
