import { beforeEach, describe, expect, it, test, vi } from "vitest";
import { applyHudSize, hudScale, registerSettings, SIZE_SETTING } from "./settings";

/** Foundry's settings registry, which is not here. Returns the spy standing in for `register`. */
function stubSettings() {
  const register = vi.fn();
  (globalThis as unknown as { game: { settings: unknown } }).game.settings = { register };
  return register;
}

/** The `data` argument of the one `register` call, which is where every choice below lives. */
function registered(register: ReturnType<typeof stubSettings>) {
  return register.mock.calls[0]?.[2] as {
    scope: string;
    config: boolean;
    default: string;
    choices: Record<string, string>;
    onChange: (value: string) => void;
  };
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

describe("registerSettings", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--gurps-hud-scale");
  });

  it("registers the size under the module id", () => {
    const register = stubSettings();
    registerSettings();

    expect(register).toHaveBeenCalledWith("gurps-hud", SIZE_SETTING, expect.anything());
  });

  it("offers three sizes", () => {
    const register = stubSettings();
    registerSettings();

    expect(Object.keys(registered(register).choices)).toEqual(["small", "medium", "large"]);
  });

  it("defaults to medium", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register).default).toBe("medium");
  });

  /* The right size is a fact about the screen the HUD is read on, not about the world. */
  it("stores the size per client", () => {
    const register = stubSettings();
    registerSettings();

    expect(registered(register).scope).toBe("client");
  });

  it("applies a size the moment it changes, without a reload", () => {
    const register = stubSettings();
    registerSettings();
    registered(register).onChange("small");

    expect(document.documentElement.style.getPropertyValue("--gurps-hud-scale")).toBe(
      String(hudScale("small")),
    );
  });
});
