import type { Result } from "axe-core";

/**
 * One line per violation -- `rule: selector, selector` -- which is how a known violation is written
 * down in a test, so what a scan found can be compared against a list somebody maintains by hand.
 * It names the rule and the element and nothing else: axe's own result carries help text, a
 * versioned URL and the element's serialized HTML, all of which churn without the problem changing.
 */
export function violationLines(violations: Result[]): string[] {
  return violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

/**
 * What a scan found against what it is known to find. The comparison is exact in both directions,
 * which is the whole contract: a new violation fails, and so does a listed one that stopped
 * happening, so no exception outlives the problem it records.
 */
export function compareViolations(
  found: string[],
  known: string[],
): { pass: boolean; message: string } {
  const appeared = found.filter((line) => !known.includes(line));
  const gone = known.filter((line) => !found.includes(line));

  const report = [
    appeared.length > 0 &&
      `Accessibility violations that are not on the known list:\n\n${list(appeared)}\n\n` +
        `Fix them, or record them in \`except\` if the fix has to wait.`,
    gone.length > 0 &&
      `On the known list, but no longer happening:\n\n${list(gone)}\n\n` +
        `They are fixed -- delete them from \`except\`, which is a to-do list rather than a ` +
        `standing allowance.`,
  ]
    .filter((block) => block !== false)
    .join("\n\n");

  return {
    pass: report === "",
    message: report === "" ? `Expected accessibility violations, but found none.` : report,
  };
}

function list(lines: string[]): string {
  return lines.map((line) => `  ${line}`).join("\n");
}
