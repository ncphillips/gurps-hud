import "./styles/gurps-hud.css";
import { log } from "./log";
import { t } from "./i18n";
import { PersistentHudApp } from "./apps/persistent-hud/PersistentHudApp";
import { applyHudSize, currentHudSize, registerSettings } from "./settings";

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
});

Hooks.once("ready", () => {
  applyHudSize(currentHudSize());
  void persistentHud?.render({ force: true });
});
