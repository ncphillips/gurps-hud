import { afterEach, beforeEach, describe, expect, it, test, vi } from "vitest";
import {
  applyHudScale,
  applyHudTheme,
  currentHotbarMode,
  DEFAULT_HUD_SCALE,
  HOTBAR_SETTING,
  hudScale,
  HUD_SCALE_STEP,
  MAX_HUD_SCALE,
  MIN_HUD_SCALE,
  HOTBAR_MODE_HOOK,
  currentMinimized,
  MINIMIZED_HOOK,
  MINIMIZED_SETTING,
  registerSettings,
  resolveHotbarMode,
  resolveHudTheme,
  showsDefaultHotbar,
  showsHudHotbar,
  SCALE_SETTING,
  THEME_SETTING,
  toggleMinimized,
} from "./settings";

/** Foundry's settings registry, which is not here. Returns the spy standing in for `register`. */
function stubSettings() {
  const register = vi.fn();
  (globalThis as unknown as { game: { settings: unknown } }).game.settings = { register };
  return register;
}

/** Foundry's settings store, holding the one answer the test cares about. */
function stubStoredSetting(key: string, value: unknown) {
  const get = vi.fn((_module: string, asked: string) => (asked === key ? value : undefined));
  (globalThis as unknown as { game: { settings: unknown } }).game.settings = { get };
}

/** Foundry's settings store, holding one stored answer and taking writes. Returns the spy for `set`. */
function stubWritableSetting(key: string, value: unknown) {
  const get = vi.fn((_module: string, asked: string) => (asked === key ? value : undefined));
  const set = vi.fn().mockResolvedValue(undefined);
  (globalThis as unknown as { game: { settings: unknown } }).game.settings = { get, set };
  return set;
}

/** Foundry's hook bus, which is not here. Returns the spy standing in for `callAll`. */
function stubHooks() {
  const callAll = vi.fn();
  vi.stubGlobal("Hooks", { callAll });
  return callAll;
}

/** The `data` argument of the `register` call for one setting, which is where every choice lives. */
function registered(register: ReturnType<typeof stubSettings>, key: string) {
  const call = register.mock.calls.find((args) => args[1] === key);
  return call?.[2] as {
    scope: string;
    config: boolean;
    default: unknown;
    choices: Record<string, string>;
    range: { min: number; max: number; step: number };
    onChange: (value: unknown) => void;
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
  it("is the multiple the reader chose", () => {
    expect(hudScale(1.3)).toBe(1.3);
  });

  /* The slider cannot ask for these, but a macro or the console can, and `zoom` would take them. */
  test("a multiple under the floor", () => {
    expect(hudScale(0.1)).toBe(MIN_HUD_SCALE);
  });

  test("a multiple over the ceiling", () => {
    expect(hudScale(10)).toBe(MAX_HUD_SCALE);
  });

  /* What a client who stored one of the old named sizes reads back as. */
  test("a scale that is not a number at all", () => {
    expect(hudScale("large")).toBe(DEFAULT_HUD_SCALE);
  });

  /* `Number(null)` is 0, which clamps to the floor -- so the harness's absent parameter is here. */
  test("no scale at all", () => {
    expect(hudScale(null)).toBe(DEFAULT_HUD_SCALE);
  });

  test("an empty scale", () => {
    expect(hudScale("")).toBe(DEFAULT_HUD_SCALE);
  });
});

describe("applyHudScale", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--gurps-hud-scale");
  });

  it("publishes the chosen scale as --gurps-hud-scale", () => {
    applyHudScale(1.5);

    expect(document.documentElement.style.getPropertyValue("--gurps-hud-scale")).toBe(
      String(hudScale(1.5)),
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

/*
 * The strip carries a macro bar of its own, and hid Foundry's the moment it appeared. A table that
 * has furnished the stock hotbar -- or handed it to another module -- wants it back, so the three
 * modes are the three answers. Each is also an answer about the Game Aid's modifier bucket: the
 * system parks that beside `#hotbar`, so wherever the stock bar is on screen the bucket is left
 * where the system put it rather than being adopted into the strip.
 */
describe("resolveHotbarMode", () => {
  it("is the HUD's own bar when the reader asked for it", () => {
    expect(resolveHotbarMode("hud")).toBe("hud");
  });

  it("is Foundry's bar when the reader asked for it", () => {
    expect(resolveHotbarMode("default")).toBe("default");
  });

  it("is both when the reader asked for both", () => {
    expect(resolveHotbarMode("both")).toBe("both");
  });

  /* The strip replaced the stock bar before the setting existed, so that is what an unknown is. */
  test("a mode the catalogue does not have", () => {
    expect(resolveHotbarMode("neither")).toBe("hud");
  });
});

describe("showsHudHotbar", () => {
  it("is true when only the HUD's bar was asked for", () => {
    expect(showsHudHotbar("hud")).toBe(true);
  });

  it("is true under both", () => {
    expect(showsHudHotbar("both")).toBe(true);
  });

  it("is false when only Foundry's bar was asked for", () => {
    expect(showsHudHotbar("default")).toBe(false);
  });
});

describe("showsDefaultHotbar", () => {
  it("is true when only Foundry's bar was asked for", () => {
    expect(showsDefaultHotbar("default")).toBe(true);
  });

  it("is true under both", () => {
    expect(showsDefaultHotbar("both")).toBe(true);
  });

  it("is false when only the HUD's bar was asked for", () => {
    expect(showsDefaultHotbar("hud")).toBe(false);
  });
});

describe("currentHotbarMode", () => {
  it("is the mode the reader stored", () => {
    stubStoredSetting(HOTBAR_SETTING, "both");

    expect(currentHotbarMode()).toBe("both");
  });

  /* Before a world has the setting -- an upgrade, or the config never opened -- nothing changes. */
  test("a client that has never stored one", () => {
    stubStoredSetting(HOTBAR_SETTING, undefined);

    expect(currentHotbarMode()).toBe("hud");
  });
});

describe("currentMinimized", () => {
  it("is true when the reader minimized the HUD", () => {
    stubStoredSetting(MINIMIZED_SETTING, true);

    expect(currentMinimized()).toBe(true);
  });

  /* The harness hands every setting over as the query string spells it. */
  test("a minimized HUD spelled as a string", () => {
    stubStoredSetting(MINIMIZED_SETTING, "true");

    expect(currentMinimized()).toBe(true);
  });

  test("a client that has never stored one", () => {
    stubStoredSetting(MINIMIZED_SETTING, undefined);

    expect(currentMinimized()).toBe(false);
  });
});

describe("toggleMinimized", () => {
  it("minimizes an expanded HUD", () => {
    const set = stubWritableSetting(MINIMIZED_SETTING, false);
    void toggleMinimized();

    expect(set).toHaveBeenCalledWith("gurps-hud", MINIMIZED_SETTING, true);
  });

  it("expands a minimized HUD", () => {
    const set = stubWritableSetting(MINIMIZED_SETTING, true);
    void toggleMinimized();

    expect(set).toHaveBeenCalledWith("gurps-hud", MINIMIZED_SETTING, false);
  });
});

describe("registerSettings", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--gurps-hud-scale");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-hud-theme");
    vi.unstubAllGlobals();
  });

  it("registers the scale under the module id", () => {
    const register = stubSettings();
    registerSettings();

    expect(register).toHaveBeenCalledWith("gurps-hud", SCALE_SETTING, expect.anything());
  });

  it("offers the multiples between the floor and the ceiling, a tenth at a time", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, SCALE_SETTING).range).toEqual({
      min: MIN_HUD_SCALE,
      max: MAX_HUD_SCALE,
      step: HUD_SCALE_STEP,
    });
  });

  it("defaults to 1x, the size the strip was designed at", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, SCALE_SETTING).default).toBe(DEFAULT_HUD_SCALE);
  });

  /* The right scale is a fact about the screen the HUD is read on, not about the world. */
  it("stores the scale per client", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, SCALE_SETTING).scope).toBe("client");
  });

  it("applies a scale the moment it changes, without a reload", () => {
    const register = stubSettings();
    registerSettings();
    registered(register, SCALE_SETTING).onChange(1.5);

    expect(document.documentElement.style.getPropertyValue("--gurps-hud-scale")).toBe(
      String(hudScale(1.5)),
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

  it("registers the hotbar under the module id", () => {
    const register = stubSettings();
    registerSettings();

    expect(register).toHaveBeenCalledWith("gurps-hud", HOTBAR_SETTING, expect.anything());
  });

  it("offers the HUD's bar, Foundry's, and both", () => {
    const register = stubSettings();
    registerSettings();

    expect(Object.keys(registered(register, HOTBAR_SETTING).choices)).toEqual([
      "hud",
      "default",
      "both",
    ]);
  });

  /* The strip replaced the stock bar before the setting existed, so an upgrade changes nothing. */
  it("defaults to the HUD's own bar", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, HOTBAR_SETTING).default).toBe("hud");
  });

  /* Which bar somebody wants is a fact about how they play, not about the world. */
  it("stores the hotbar per client", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, HOTBAR_SETTING).scope).toBe("client");
  });

  /*
   * Foundry announces a world setting through `updateSetting` and a client one not at all, so the
   * two things that have to follow -- the strip's footer and the modifier bucket -- are told here.
   */
  it("announces a hotbar change, so the strip and the bucket follow without a reload", () => {
    const callAll = stubHooks();
    const register = stubSettings();
    registerSettings();
    registered(register, HOTBAR_SETTING).onChange("both");

    expect(callAll).toHaveBeenCalledWith(HOTBAR_MODE_HOOK, "both");
  });

  it("registers minimized under the module id", () => {
    const register = stubSettings();
    registerSettings();

    expect(register).toHaveBeenCalledWith("gurps-hud", MINIMIZED_SETTING, expect.anything());
  });

  it("defaults to expanded", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, MINIMIZED_SETTING).default).toBe(false);
  });

  /* Whether the strip is in the way is a fact about the screen it is read on, not about the world. */
  it("stores minimized per client", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, MINIMIZED_SETTING).scope).toBe("client");
  });

  /* The strip's own button and the keybinding are what change it, not the settings form. */
  it("keeps minimized out of the settings form", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register, MINIMIZED_SETTING).config).toBe(false);
  });

  it("announces minimizing, so the strip follows without a reload", () => {
    const callAll = stubHooks();
    const register = stubSettings();
    registerSettings();
    registered(register, MINIMIZED_SETTING).onChange(true);

    expect(callAll).toHaveBeenCalledWith(MINIMIZED_HOOK, true);
  });
});
