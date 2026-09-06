import "./styles/gurps-hud.css";
import { log } from "./log";
import { PersistentHudApp } from "./apps/persistent-hud/PersistentHudApp";

const { MODIFIER_KEYS } = foundry.helpers.interaction.KeyboardManager;

let persistentHud: PersistentHudApp | null = null;

Hooks.once("init", () => {
  log("Initialized");

  persistentHud = new PersistentHudApp({});

  game.keybindings!.register("gurps-hud", "togglePersistentHud", {
    name: "GURPS HUD: Toggle the persistent HUD",
    editable: [{ key: "KeyH", modifiers: [MODIFIER_KEYS.CONTROL, MODIFIER_KEYS.SHIFT] }],
    onDown: () => {
      persistentHud?.toggle();
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
});

Hooks.once("ready", () => {
  void persistentHud?.render({ force: true });
});
