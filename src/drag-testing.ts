/**
 * Drag and drop, spelled as the gesture somebody makes rather than as the events it fires.
 *
 *   await dragging(payload, grip).over(row).dropOn(otherRow);
 *
 * Every step fires what a browser fires, in the order a browser fires it: crossing between two
 * elements is the *new* one's `dragenter` and then the old one's `dragleave` -- that order, checked
 * against Chromium -- each naming the other in `relatedTarget`. Chaining is what makes a sequence
 * readable, so each step queues its events and the gesture as a whole is awaited once at the end.
 *
 * The steps take elements rather than keys or slots, so anything the HUD lets you drag -- an
 * attack, a macro, whatever comes next -- is dragged the same way.
 */
import { createEvent, fireEvent } from "@testing-library/svelte";

export interface Gesture extends PromiseLike<unknown> {
  /** The pointer crosses onto that element, leaving whatever it was over. */
  over(element: Element): Gesture;
  /** Released on that element. */
  dropOn(element: Element): Gesture;
  /** Out of that element and onto nothing, then let go: the drag that carries something away. */
  outOf(element: Element): Gesture;
  /** Escape, which ends a drag where it stands: nothing dropped, and the pointer never left. */
  cancel(): Gesture;
}

/**
 * What a drag carries. Foundry drags everything on `text/plain`, so the payload is the only thing
 * that says what is being dragged -- and, during `dragenter` and `dragover`, a real browser will
 * not let it be read at all.
 */
function carrying(payload: string): { dataTransfer: DataTransfer } {
  return {
    dataTransfer: {
      types: ["text/plain"],
      getData: () => payload,
      setData: () => undefined,
    } as unknown as DataTransfer,
  };
}

/**
 * jsdom has no `DragEvent`, so Testing Library builds a plain `Event` and drops `relatedTarget`
 * from the init -- and `relatedTarget` is the whole of what tells leaving an element from crossing
 * into one of its own children. Defining it back on is the only difference from `fireEvent.dragLeave`.
 */
function dragLeave(element: Element, onto: Element | null): Promise<boolean> {
  const event = createEvent.dragLeave(element);
  Object.defineProperty(event, "relatedTarget", { value: onto });

  return fireEvent(element, event);
}

/**
 * @param payload What the drag carries, as the thing it was dragged off puts it on the wire.
 * @param from The element the drag started on, for a drag that starts inside the app. A drag from
 *   somewhere else -- a character sheet, a sidebar -- has no source here, and so no `dragend`.
 */
export function dragging(payload: string, from: Element | null = null): Gesture {
  const carried = carrying(payload);
  let queued: Promise<unknown> = from ? fireEvent.dragStart(from, carried) : Promise.resolve();
  let over: Element | null = null;

  const step = (fire: () => Promise<unknown>): Gesture => {
    queued = queued.then(fire);
    return gesture;
  };

  /** Every gesture that ends the drag ends it the same way, on whatever it was picked up by. */
  const dragEnd = (): Promise<unknown> => (from ? fireEvent.dragEnd(from) : Promise.resolve(false));

  const gesture: Gesture = {
    over: (element) =>
      step(async () => {
        const left = over;
        over = element;
        await fireEvent.dragEnter(element, carried);
        if (left) await dragLeave(left, element);
      }),

    dropOn: (element) =>
      step(async () => {
        over = null;
        await fireEvent.drop(element, carried);
        await dragEnd();
      }),

    outOf: (element) =>
      step(async () => {
        over = null;
        await dragLeave(element, null);
        await dragEnd();
      }),

    cancel: () => step(dragEnd),

    then: (resolved, rejected) => queued.then(resolved, rejected),
  };

  return gesture;
}
