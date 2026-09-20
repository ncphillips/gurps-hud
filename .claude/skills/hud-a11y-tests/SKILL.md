---
name: hud-a11y-tests
description: How accessibility testing works in gurps-hud — the two *.a11y.test.ts groups, axeViolations, and the EXCEPTIONS exact-list contract. Use when writing, fixing, or debugging a11y tests or an npm run test:a11y failure.
---

# Accessibility tests

Accessibility is its own group, named `*.a11y.test.ts` in both runners:

- A component's scans sit beside it and mount it in Vitest's browser mode (headless Chromium, driven
  by Playwright).
- `e2e/persistent-hud.a11y.test.ts` scans the assembled strip in each state the harness can open.

Both call `axeViolations` from `src/a11y-scan.ts` and assert the exact list against that file's
`EXCEPTIONS` array — the accessibility to-do list for what it scans. A new violation fails the scan
**and so does fixing a listed one**, so no exception outlives the problem it records: when you fix a
violation, delete its entry from `EXCEPTIONS` in the same change.

Contrast is excluded from those scans and has its own pair of tests at the end of
`e2e/persistent-hud.a11y.test.ts`, one per palette: each sweeps every state the harness can open in
that theme and asserts the union against `CONTRAST_EXCEPTIONS`. **Both lists are empty** — the strip
meets AA in dark and in light — so any colour that does not is a failure rather than a new entry. A
failure is reported as the colour pair that caused it (`#555556 on #16171b: 2.40:1, needs 4.5:1`)
rather than the element carrying it, because it is one decision about the palette however many cells
it is read in.

The faint end of the ink is a single token, `--color-hud-faint`, sized to the AA floor with a
different alpha per theme — dark clears it at 62% where light needs 69%. Reach for that rung rather
than a new `text-hud-ink/NN` below it, and if you change a surface, re-run the sweep: the pool box
under the cursor is the lightest ground faint text lands on, and it is what the rung is sized against.

Run both groups with `npm run test:a11y`.
