---
name: hud-a11y-tests
description: How accessibility testing works in gurps-hud — the two *.a11y.test.ts groups, the toBeAccessible matcher, and its exact-list `except` contract. Use when writing, fixing, or debugging a11y tests or a pnpm run test:a11y failure.
---

# Accessibility tests

Accessibility is its own group, named `*.a11y.test.ts` in both runners:

- A component's scans sit beside it and mount it in Vitest's browser mode (headless Chromium, driven
  by Playwright).
- `e2e/persistent-hud.a11y.test.ts` scans the assembled strip in each state the harness can open.

Both assert with `toBeAccessible`, and a component or state that is known to fail names what it
fails with:

```ts
await expect(container).toBeAccessible();
await expect(container).toBeAccessible({ except: ["label: input"] });
```

An entry in `except` is a `rule: selector` line and it is **the accessibility to-do list** — write it
beside the test that has it, with a comment saying what the fix is. The comparison is exact in both
directions, so a new violation fails **and so does an `except` entry that stopped happening**: when
you fix a violation, delete its entry in the same change. The matcher's failure message says which
way it went.

The matcher is registered per runner — `src/a11y-setup.ts` extends Vitest's `expect` over an
element, `e2e/a11y.ts` extends Playwright's over a page, anchored to `#gurps-hud-persistent`. Both
compare and report through `src/testing/a11y.ts`, so a failure reads the same in either.

A component is scanned on the HUD's own ground: `src/a11y-setup.ts` gives the page the `.gurps-hud`
class and the panel background, so the colours axe computes are the ones the component is read on.

The strip's colours are also checked per palette, by the pair of tests at the end of
`e2e/persistent-hud.a11y.test.ts` — the only place light mode is opened at all. Each sweeps every
state the harness can open in that theme and asserts the union against `CONTRAST_EXCEPTIONS`. **Both
lists are empty**, so a colour that misses AA is a failure rather than a new entry. A failure names
the colour pair (`#555556 on #16171b: 2.40:1, needs 4.5:1`), which is what you act on.

The faint end of the ink is a single token, `--color-hud-faint`, sized to the AA floor with a
different alpha per theme — dark clears it at 62% where light needs 69%. Reach for that rung rather
than a new `text-hud-ink/NN` below it, and if you change a surface, re-run the sweep: the pool box
under the cursor is the lightest ground faint text lands on, and it is what the rung is sized against.

Run both groups with `pnpm run test:a11y`.
