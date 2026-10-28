/**
 * An attack's VTT notes, as the character sheet shows them: prose with `[OtF]` buttons in it. The
 * Game Aid's `gurpslink` does the parsing and hands back HTML; this reads that HTML back into plain
 * runs and buttons, so the HUD renders its own elements rather than injecting the system's -- whose
 * unlayered pill styles would outrank every utility on the strip.
 */

export interface NoteSegment {
  text: string;
  /** Present when the run is a button: the OtF the Game Aid would execute for it. */
  otf?: string;
}

export function noteSegments(html: string): NoteSegment[] {
  const body = new DOMParser().parseFromString(html, "text/html").body;
  const segments: NoteSegment[] = [];

  for (const node of body.childNodes) {
    const otf = node instanceof HTMLElement ? node.dataset.otf : undefined;
    const text = node.textContent ?? "";
    if (otf) {
      segments.push({ text, otf });
      continue;
    }
    if (!text) continue;

    const last = segments.at(-1);
    if (last && !last.otf) last.text += text;
    else segments.push({ text });
  }

  return segments;
}
