import axe, { type ElementContext, type RunOptions } from "axe-core";

/**
 * Runs axe-core over one element and returns its violations as one readable line each --
 * `rule: selector, selector` -- so a scan can be asserted against a plain list of strings.
 *
 * Every scan asserts the exact list, against an `EXCEPTIONS` array of the violations that component
 * is known to have. That makes each array the component's accessibility to-do list, and it cuts
 * both ways: a new violation fails the scan, and so does fixing a listed one, so the list cannot
 * quietly rot.
 *
 * Contrast is off by default and tracked on its own. It fails in ~40 places across the strip,
 * nearly all of them the design's deliberately dim secondary text, so folding it in would leave
 * every other rule unguarded behind one permanently red test.
 */
export async function axeViolations(
  element: ElementContext,
  options: RunOptions = {},
): Promise<string[]> {
  const { violations } = await axe.run(element, {
    rules: { "color-contrast": { enabled: false } },
    ...options,
  });

  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}
