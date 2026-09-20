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
 * Contrast is off by default and scanned elsewhere: `e2e/persistent-hud.a11y.test.ts` sweeps the
 * assembled strip in both palettes and reports what fails as colour pairs rather than selectors.
 * That is the right altitude for it -- one ink drawn too faint fails in dozens of cells, and it is
 * the same decision about the palette in every one of them -- and it keeps each list here about
 * markup. Both palettes pass, so those lists are empty.
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
