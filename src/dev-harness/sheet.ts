/**
 * A stand-in for the GURPS character sheet: the attack rows a real sheet lets you drag, and nothing
 * else. It exists so the e2e suite can perform the gesture this feature is for -- pulling an attack
 * off a sheet and onto the strip -- without a Foundry world, and so a *second* character's sheet can
 * prove the strip refuses attacks that are not its actor's.
 *
 * The payload is copied from `GurpsActorSheet#makelistdrag` in `crnormand/gurps`: the actor's id,
 * the list key, and the type. That shape is the whole contract between the sheet and the HUD, so it
 * is the one part of the stand-in that has to be faithful -- a harness that hands over something a
 * real sheet never would would agree with a HUD no world agrees with.
 */
import { meleeRows, rangedRows } from "@/gurps/hud-view";
import type { HarnessActor } from "./cast";

export function openSheet(actor: HarnessActor): HTMLElement {
  const sheet = document.createElement("div");
  sheet.dataset.harnessSheet = actor.id;
  sheet.style.cssText =
    "position:fixed;top:16px;left:16px;width:220px;padding:8px;border-radius:6px;" +
    "background:#2b2c31;color:#e8e6e1;font:12px/1.6 system-ui;z-index:10";

  const title = document.createElement("div");
  title.textContent = actor.name;
  title.style.cssText = "font-weight:700;margin-bottom:4px";
  sheet.append(title);

  const attacks = [...meleeRows(actor.system), ...rangedRows(actor.system)];
  for (const attack of attacks) sheet.append(row(actor, attack));

  document.body.append(sheet);
  return sheet;
}

function row(actor: HarnessActor, attack: { key: string; name: string }): HTMLElement {
  const element = document.createElement("div");
  element.dataset.harnessSheetAttack = attack.key;
  element.textContent = attack.name;
  element.draggable = true;
  element.style.cssText = "cursor:grab;padding:1px 3px";

  element.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData(
      "text/plain",
      JSON.stringify({
        actorid: actor.id,
        isLinked: true,
        type: attack.key.startsWith("system.melee.") ? "melee" : "ranged",
        key: attack.key,
      }),
    );
  });

  return element;
}
