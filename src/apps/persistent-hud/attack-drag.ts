/**
 * Drag state for the attack tables, shared by the whole strip rather than owned by a row. A row
 * picked up in the tables can be put down on another row, elsewhere on the strip, or nowhere at
 * all -- and that last case is what removes it -- so every part of the strip a drag can end on has
 * to be reading the same one.
 */
export interface AttackDrag {
  /** The attack key being dragged out of the tables, or null when the drag started on a sheet. */
  from: string | null;
  /** The row under the pointer, marked as where the attack would land. */
  over: string | null;
  /**
   * Set by anywhere on the strip that accepts the drop. `dragend` reads it to tell an attack that
   * was moved from one dragged clear of the strip, which is the gesture that takes it off.
   */
  landed: boolean;
  /**
   * Whether the attack has been carried out of the tables. Removal needs this as well as a drag
   * that never landed, because Escape ends a drag exactly the way letting go over the desktop
   * does -- `dragend`, nothing dropped -- and cancelling a drag must not delete the attack.
   */
  outside: boolean;
}

export function attackDrag(): AttackDrag {
  return { from: null, over: null, landed: false, outside: false };
}
