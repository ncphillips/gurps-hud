# e2e

Anything only a browser can answer — does this wrap, is this box where the mock puts it — belongs
here, driving the harness via its query parameters rather than a live world. Give elements a
`data-hud-*` hook to select on.

`Locator.evaluateAll` does **not** auto-wait, so wait for the panel first (`openHarness` does) or the
measurement silently runs against nothing.
