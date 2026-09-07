/**
 * Drag state shared by every macro slot on screen. It lives outside the components because a drag
 * that starts in the bar can end in the library and vice versa: `from` is what tells a drop apart
 * from a macro, item or roll table arriving from elsewhere in Foundry, so both halves of the macro
 * UI have to read the same one.
 */
export interface MacroDrag {
  /** The slot a macro was picked up from, or null when the drag started outside the HUD. */
  from: number | null;
  /** The slot currently under the pointer, highlighted as the drop target. */
  over: number | null;
}

export function macroDrag(): MacroDrag {
  return { from: null, over: null };
}
