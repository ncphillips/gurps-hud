/*
 * Visual harness for the HUD. Mounts the real components against stub Foundry globals so the design
 * can be checked -- and measured against design-handoff/ -- without launching Foundry.
 *
 *   npm run harness   ->  http://localhost:30099/modules/gurps-hud/dev-harness/index.html
 *
 * The whole cast is always on the canvas (see cast.ts); every parameter names the *action* it takes
 * on that scene rather than just the thing it concerns, so a URL reads as the state it sets up:
 *
 *   ?selected_actor=brent|goblin   who the strip is showing; `selected_actor=` selects nobody,
 *                                  which is the empty strip a GM sees before clicking a token
 *   ?target_actor=goblin           who is targeted, so the TARGET pill lists their hit locations
 *   ?set_maneuver=attack           puts the selected actor in the active combat performing it
 *   ?hover_panel=attrs             opens that hover panel on load, so it can be screenshotted
 *   ?edit_pool=hp|fp               opens that pool's box for editing
 *   ?expand_macros=true            expands the macro footer's library of all five hotbar pages
 *   ?pick_attacks=none             leaves every attack unpicked, which is where a fresh actor starts
 *   ?open_sheet=brent|goblin       opens a stand-in character sheet whose attack rows can be
 *                                  dragged onto the strip, as a real sheet's can
 *   ?set_macro_page=3              which hotbar page the number keys address
 *   ?measure=true                  appends a <pre id="measurements"> of key bounding boxes
 */
import "@/styles/gurps-hud.css";
import { mount } from "svelte";
import PersistentHud from "@/apps/persistent-hud/PersistentHud.svelte";
import { allAttackPicks } from "@/gurps/hud-view";
import { foundryI18n } from "@/i18n/stub";
import { CAST, TOKENS, castMember } from "./cast";
import { fire, hooksStub } from "./hooks";
import { openSheet } from "./sheet";

/** Keys the GURPS system owns; the HUD's own come from `lang/en.json` through the stub. */
const LABELS: Record<string, string> = {
  "GURPS.status.Standing": "Standing",
  "GURPS.status.Crouch": "Crouching",
  "GURPS.status.Kneel": "Kneeling",
  "GURPS.status.Sit": "Sitting",
  "GURPS.status.Crawling": "Crawling",
  "GURPS.status.Prone": "Prone",
  "GURPS.maneuverCommittedAttack": "Committed Attack",
};

const params = new URLSearchParams(location.search);

/** Booleans are spelled out -- `expand_macros=true` -- so a parameter never reads as a bare noun. */
function flag(name: string): boolean {
  return params.get(name) === "true";
}

/*
 * Absent means Brent, the design's character, because that is the view worth landing on. Present
 * but empty -- `?selected_actor=` -- means nobody, and so does a name no one in the cast answers to.
 */
const selectedActor = params.has("selected_actor")
  ? castMember(params.get("selected_actor"))
  : CAST.brent;
const targetActor = castMember(params.get("target_actor"));

/*
 * An actor starts with no attacks picked, but the design mock is drawn with Brent's weapon tables
 * full -- so the harness lands on the curated view and `?pick_attacks=none` opens the other one.
 */
if (params.get("pick_attacks") !== "none") {
  for (const member of Object.values(CAST)) {
    void member.setFlag?.("gurps-hud", "attacks", allAttackPicks(member.system));
  }
}

/*
 * Setting a maneuver also puts its actor in the active combat: the Game Aid only stores one for a
 * token that is in it, and the HUD's pill mirrors that, so a maneuver without a combat is a state
 * no world can be in.
 */
const maneuver = params.get("set_maneuver");
if (maneuver && selectedActor) selectedActor.system.conditions.maneuver = maneuver;

/**
 * All five pages of Foundry's hotbar, as slots 1-50, mutable so the harness can demonstrate
 * assigning, reordering and removing macros -- including across pages, in the macro library.
 */
const hotbar: (string | null)[] = Array.from({ length: 50 }, (_, index) => {
  const slot = index + 1;
  const column = index % 10;
  return column < 3 || column === 9 ? `Macro ${slot}` : null;
});

Object.assign(globalThis, {
  GURPS: {
    LastActor: selectedActor,
    SetLastActor: (next: unknown) => {
      (globalThis as { GURPS: { LastActor: unknown } }).GURPS.LastActor = next;
      fire("updateLastActorGURPS");
    },
    executeOTF: async (otf: string) => {
      console.log("harness: roll", otf);
      return true;
    },
    ModifierBucket: {
      addModifier: (mod: number, reason: string) => console.log("harness: bucket", mod, reason),
    },
    Maneuvers: {
      getManeuver: (id?: string) =>
        id === "committed_attack" ? { label: "GURPS.maneuverCommittedAttack" } : undefined,
    },
  },
  Hooks: hooksStub,
  canvas: {
    tokens: {
      controlled: [],
      placeables: TOKENS,
      get: (id: string) => TOKENS.find((token) => token.id === id),
    },
  },
  ui: {
    // Mirrors Foundry: `changePage` is what actually moves the page, and the HUD reads it back.
    hotbar: {
      page: Number(params.get("set_macro_page") ?? 1),
      changePage(page: number) {
        this.page = page;
      },
    },
  },
  game: {
    combats: {
      active: maneuver && selectedActor ? { combatants: [{ actor: selectedActor }] } : null,
    },
    i18n: foundryI18n(LABELS),
    user: {
      // Foundry's `UserTargets` is a Set of tokens; the HUD only ever asks it for the first one.
      targets: { first: () => (targetActor ? { actor: targetActor } : undefined) },
      // Mirrors Foundry: ten entries at a time, numbered with their slot in the full 1-50 range.
      getHotbarMacros: (page = 1) =>
        hotbar.slice((page - 1) * 10, page * 10).map((name, index) => ({
          slot: (page - 1) * 10 + index + 1,
          macro: name ? { name, img: null, uuid: `Macro.${name}`, execute: () => undefined } : null,
        })),
      // Mirrors Foundry: a `fromSlot` move swaps whatever occupied the destination back into the
      // origin, and the user update is what tells the strip to re-read the bar.
      assignHotbarMacro: (
        macro: { name: string } | null,
        slot: number,
        options?: { fromSlot?: number },
      ) => {
        const displaced = hotbar[slot - 1];
        hotbar[slot - 1] = macro?.name ?? null;
        if (options?.fromSlot) hotbar[options.fromSlot - 1] = displaced;
        fire("updateUser");
      },
    },
  },
});

// The mock's canvas-mode backdrop, so screenshots line up with design-handoff/.
document.body.style.cssText =
  "margin:0;min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;" +
  "background:#1b1c20;background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px)," +
  "linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);background-size:46px 46px;padding:26px 20px 20px";

const host = document.createElement("div");
host.id = "gurps-hud-persistent";
host.className = "gurps-hud gurps-hud-persistent";
document.body.append(host);

mount(PersistentHud, { target: host });

const sheetOwner = castMember(params.get("open_sheet"));
if (sheetOwner) openSheet(sheetOwner);

setTimeout(() => {
  const panel = params.get("hover_panel");
  if (!panel) return;

  host
    .querySelector<HTMLElement>(`[data-hud-trigger="${panel}"]`)
    ?.dispatchEvent(new MouseEvent("mouseenter"));
}, 300);

setTimeout(() => {
  const pool = params.get("edit_pool");
  if (!pool) return;

  const needle = pool === "fp" ? "Fatigue" : "Hit Points";
  [...host.querySelectorAll<HTMLButtonElement>("button[title]")]
    .find((el) => el.title.startsWith(needle))
    ?.click();
}, 300);

setTimeout(() => {
  if (!flag("expand_macros")) return;

  host.querySelector<HTMLButtonElement>('[title="Show all macros"]')?.click();
}, 300);

setTimeout(() => {
  if (!flag("measure")) return;

  const bar = host.firstElementChild;
  const row = host.querySelector("[data-hud-attack]");
  const damage = [...host.querySelectorAll("button")].find(
    (el) => el.textContent?.trim() === "1d+1 imp",
  );

  const dump = document.createElement("pre");
  dump.id = "measurements";
  dump.textContent = JSON.stringify(
    {
      bar: bar?.getBoundingClientRect(),
      row: row?.getBoundingClientRect(),
      damage: damage?.getBoundingClientRect(),
      fonts: [...document.fonts].map((font) => `${font.family} ${font.weight} ${font.status}`),
    },
    null,
    1,
  );
  document.body.append(dump);
}, 1500);
