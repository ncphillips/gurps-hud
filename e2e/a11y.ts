import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, type Page } from "@playwright/test";
import { compareViolations, violationLines } from "@/testing/a11y";

/*
 * The HUD renders inside Foundry's own page, so a scan of the whole document would report on
 * Foundry's markup as much as ours. Every scan is anchored to the strip instead.
 */
const GURPS_HUD_EL = "#gurps-hud-persistent";

/**
 * `await expect(page).toBeAccessible()`, scanning the strip, with `{ except: [...] }` for the
 * violations that state is known to have. The component scans get the same matcher over an element
 * from `src/a11y-setup.ts`, and both report a failure the same way.
 */
export const expect = baseExpect.extend({
  async toBeAccessible(page: Page, options: { except?: string[] } = {}) {
    const { violations } = await new AxeBuilder({ page }).include(GURPS_HUD_EL).analyze();
    const { pass, message } = compareViolations(violationLines(violations), options.except ?? []);

    return { name: "toBeAccessible", pass, message: () => message };
  },
});
