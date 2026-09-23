import "./styles/gurps-hud.css";
import { log } from "./log";
import { t } from "./i18n";
import { PersistentHudApp } from "./apps/persistent-hud/PersistentHudApp";
import {
  applyHudScale,
  applyHudTheme,
  currentHudScale,
  currentHudTheme,
  registerSettings,
  toggleMinimized,
} from "./settings";

const { MODIFIER_KEYS } = foundry.helpers.interaction.KeyboardManager;

let persistentHud: PersistentHudApp | null = null;

Hooks.once("init", () => {
  log("Initialized");

  registerSettings();

  persistentHud = new PersistentHudApp({});

  game.keybindings!.register("gurps-hud", "togglePersistentHud", {
    name: t("keybindings.togglePersistentHud"),
    editable: [{ key: "KeyH", modifiers: [MODIFIER_KEYS.CONTROL, MODIFIER_KEYS.SHIFT] }],
    onDown: () => {
      persistentHud?.toggle();
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });

  game.keybindings!.register("gurps-hud", "toggleMinimized", {
    name: t("keybindings.toggleMinimized"),
    editable: [{ key: "KeyH", modifiers: [MODIFIER_KEYS.SHIFT] }],
    onDown: () => {
      void toggleMinimized();
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
});

Hooks.once("ready", () => {
  applyHudScale(currentHudScale());
  applyHudTheme(currentHudTheme());
  void persistentHud?.render({ force: true });
});
