import { afterEach, beforeEach, describe, expect, it, test, vi } from "vitest";
import {
  applyHudSize,
  applyHudTheme,
  hudScale,
  registerSettings,
  resolveHudTheme,
  SIZE_SETTING,
  THEME_SETTING,
} from "./settings";

/** Foundry's settings registry, which is not here. Returns the spy standing in for `register`. */
function stubSettings() {
  const register = vi.fn();
  (globalThis as unknown as { game: { settings: unknown } }).game.settings = { register };
  return register;
}

/** The `data` argument of the `register` call for one setting, which is where every choice lives. */
function registered(register: ReturnType<typeof stubSettings>, key: string) {
  const call = register.mock.calls.find((args) => args[1] === key);
  return call?.[2] as {
    scope: string;
    config: boolean;
    default: string;
    choices: Record<string, string>;
    onChange: (value: string) => void;
  };
}

/**
 * `prefers-color-scheme`, which jsdom does not answer. Returns the listeners it collects, so a test
 * can say the OS changed its mind after the HUD asked.
 */
function stubColorScheme(light: boolean) {
  const listeners: (() => void)[] = [];
  const query = {
    matches: light,
    addEventListener: (_event: string, listener: () => void) => void listeners.push(listener),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(query));
  return {
    query,
    /** Flips the OS and tells everyone listening, as the browser does. */
    switchTo(nowLight: boolean) {
      query.matches = nowLight;
      for (const listener of listeners) listener();
    },
  };
}

function themeAttribute(): string | null {
  return document.documentElement.getAttribute("data-hud-theme");
}

describe("hudScale", () => {
  it("is 1 at medium, the size the strip was designed at", () => {
    expect(hudScale("medium")).toBe(1);
  });

  it("is under 1 at small", () => {
    expect(hudScale("small")).toBeLessThan(1);
  });

  it("is over 1 at large", () => {
    expect(hudScale("large")).toBeGreaterThan(1);
  });

  test("a size the catalogue does not have", () => {
    expect(hudScale("enormous")).toBe(1);
  });
});

describe("applyHudSize", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--gurps-hud-scale");
  });

  it("publishes the size's scale as --gurps-hud-scale", () => {
    applyHudSize("large");

    expect(document.documentElement.style.getPropertyValue("--gurps-hud-scale")).toBe(
      String(hudScale("large")),
    );
  });
});

describe("resolveHudTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is light when the reader asked for light", () => {
    expect(resolveHudTheme("light")).toBe("light");
  });

  it("is dark when the reader asked for dark", () => {
    expect(resolveHudTheme("dark")).toBe("dark");
  });

  it("is light under system on a light desktop", () => {
    stubColorScheme(true);

    expect(resolveHudTheme("system")).toBe("light");
  });

  it("is dark under system on a dark desktop", () => {
    stubColorScheme(false);

    expect(resolveHudTheme("system")).toBe("dark");
  });

  /* The strip was drawn dark, so that is what it falls back to wherever nothing says otherwise. */
  test("a browser that cannot answer prefers-color-scheme", () => {
    vi.stubGlobal("matchMedia", undefined);

    expect(resolveHudTheme("system")).toBe("dark");
  });
});

describe("applyHudTheme", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-hud-theme");
    vi.unstubAllGlobals();
  });

  it("publishes the theme as data-hud-theme", () => {
    applyHudTheme("light");

    expect(themeAttribute()).toBe("light");
  });

  it("publishes what system resolves to, not the word system", () => {
    stubColorScheme(true);
    applyHudTheme("system");

    expect(themeAttribute()).toBe("light");
  });

  it("follows the desktop while the theme is system", () => {
    const os = stubColorScheme(false);
    applyHudTheme("system");

    os.switchTo(true);

    expect(themeAttribute()).toBe("light");
  });

  it("ignores the desktop once the reader has picked a theme", () => {
    const os = stubColorScheme(false);
    applyHudTheme("dark");

    os.switchTo(true);

    expect(themeAttribute()).toBe("dark");
  });

  test("a theme the catalogue does not have", () => {
    applyHudTheme("sepia");

    expect(themeAttribute()).toBe("dark");
  });
});

describe("registerSettings", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--gurps-hud-scale");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-hud-theme");
  });

  it("registers the size under the module id", () => {
    const register = stubSettings();
    registerSettings();

    expect(register).toHaveBeenCalledWith("gurps-hud", SIZE_SETTING, expect.anything());
  });

  it("offers three sizes", () => {
    const register = stubSettings();
    registerSettings();

    expect(Object.keys(registered(register, SIZE_SETTING).choices)).toEqual([
      "small",
      "medium",
      "large",
    ]);
  });

  it("defaults to medium", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, SIZE_SETTING).default).toBe("medium");
  });

  /* The right size is a fact about the screen the HUD is read on, not about the world. */
  it("stores the size per client", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, SIZE_SETTING).scope).toBe("client");
  });

  it("applies a size the moment it changes, without a reload", () => {
    const register = stubSettings();
    registerSettings();
    registered(register, SIZE_SETTING).onChange("small");

    expect(document.documentElement.style.getPropertyValue("--gurps-hud-scale")).toBe(
      String(hudScale("small")),
    );
  });

  it("registers the theme under the module id", () => {
    const register = stubSettings();
    registerSettings();

    expect(register).toHaveBeenCalledWith("gurps-hud", THEME_SETTING, expect.anything());
  });

  it("offers dark, light and the desktop's own", () => {
    const register = stubSettings();
    registerSettings();

    expect(Object.keys(registered(register, THEME_SETTING).choices)).toEqual([
      "dark",
      "light",
      "system",
    ]);
  });

  /* The mock is dark, so an upgrade leaves the strip looking exactly as it did. */
  it("defaults to dark", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, THEME_SETTING).default).toBe("dark");
  });

  /* Which theme reads well is a fact about the room the HUD is read in, not about the world. */
  it("stores the theme per client", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, THEME_SETTING).scope).toBe("client");
  });

  it("applies a theme the moment it changes, without a reload", () => {
    const register = stubSettings();
    registerSettings();
    registered(register, THEME_SETTING).onChange("light");

    expect(themeAttribute()).toBe("light");
  });
});
