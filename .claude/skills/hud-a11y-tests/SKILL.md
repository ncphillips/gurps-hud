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

Contrast is excluded from every scan and tracked by one `test.fixme`: it is a design call on the
palette, not a markup fix.

Run both groups with `npm run test:a11y`.
