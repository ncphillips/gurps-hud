import "./styles/gurps-hud.css";
import { log } from "./log";
import { ScaffoldCheckApp } from "./apps/scaffold-check/ScaffoldCheckApp";

const { MODIFIER_KEYS } = foundry.helpers.interaction.KeyboardManager;

Hooks.once("init", () => {
  log("Initialized");

  const scaffoldCheck = new ScaffoldCheckApp({});

  game.keybindings!.register("gurps-hud", "scaffoldCheck", {
    name: "GURPS HUD: Scaffold Check",
    editable: [{ key: "KeyH", modifiers: [MODIFIER_KEYS.CONTROL, MODIFIER_KEYS.SHIFT] }],
    onDown: () => {
      scaffoldCheck.toggle();
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
});
