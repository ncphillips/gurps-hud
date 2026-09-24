/*
 * Visual harness for the HUD. Mounts the real components against stub Foundry globals so the design
 * can be looked at -- and measured, with `?measure=true` -- without launching Foundry.
 *
 *   pnpm run harness ->  http://localhost:30099/modules/gurps-hud/dev-harness/index.html
 *
 * The whole cast is always on the canvas (see cast.ts); every parameter names the *action* it takes
 * on that scene rather than just the thing it concerns, so a URL reads as the state it sets up:
 *
 *   ?selected_actor=thor|gunner   who the strip is showing; `selected_actor=` selects nobody,
 *                                  which is the empty strip a GM sees before clicking a token
 *   ?target_actor=goblin           who is targeted, so the TARGET pill lists their hit locations
 *   ?set_maneuver=attack           puts the selected actor in the active combat performing it
 *   ?hover_panel=attrs             opens that hover panel on load, so it can be screenshotted
 *   ?edit_pool=hp|fp               opens that pool's box for editing
 *   ?expand_macros=true            expands the macro footer's library of all five hotbar pages
 *   ?pick_attacks=none             leaves every attack unpicked, which is where a fresh actor starts
 *   ?open_sheet=thor|goblin       opens a stand-in character sheet whose attack rows can be
 *                                  dragged onto the strip, as a real sheet's can
 *   ?set_macro_page=3              which hotbar page the number keys address
 *   ?delay_writes=true             makes writing to an actor take a round trip, as a world does
 *   ?hud_scale=1.5                 draws the strip at that multiple of its designed size, as the
 *                                  setting does
 *   ?hud_theme=light|dark|system   draws the strip in that palette, as the setting does; `system`
 *                                  follows the desktop, so a spec asks for a palette by name
 *   ?hud_hotbar=default|both       whose macro bar is on screen, as the setting does; only the
 *                                  strip's own footer is here, since there is no Foundry hotbar
 *   ?hud_minimized=true            opens the strip folded down to its tab, as the setting does
 *   ?hud_position=120,300          opens the strip that far from the bottom-left of the window, as
 *                                  the setting does after a drag
 *   ?show_bucket=true              puts a stand-in modifier bucket beside the strip, as the Game
 *                                  Aid's is adopted into the HUD in a world
 *   ?measure=true                  appends a <pre id="measurements"> of key bounding boxes
 */
import "@/styles/gurps-hud.css";
import { mount } from "svelte";
import PersistentHud from "@/apps/persistent-hud/PersistentHud.svelte";
import { allAttackPicks } from "@/gurps/hud-view";
import { foundryI18n } from "@/i18n/stub";
import { applyHudScale, applyHudTheme, registerSettings, resolveHudTheme } from "@/settings";
import { CAST, TOKENS, castMember } from "./cast";
import type { HarnessActor } from "./cast";
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
 * Absent means Thor, the design's character, because that is the view worth landing on. Present
 * but empty -- `?selected_actor=` -- means nobody, and so does a name no one in the cast answers to.
 */
const selectedActor = params.has("selected_actor")
  ? castMember(params.get("selected_actor"))
  : CAST.thor;
const targetActor = castMember(params.get("target_actor"));

// A world reads these off the client's settings; the harness reads them off the URL. Same custom
// property and same attribute either way, so the strip scales -- and is coloured -- here exactly as
// it is in Foundry.
applyHudScale(params.get("hud_scale"));
applyHudTheme(params.get("hud_theme"));

/*
 * An actor starts with no attacks picked, but the design mock is drawn with Thor's weapon tables
 * full -- so the harness lands on the curated view and `?pick_attacks=none` opens the other one.
 */
if (params.get("pick_attacks") !== "none") {
  for (const member of Object.values(CAST)) {
    void member.setFlag?.("gurps-hud", "attacks", allAttackPicks(member.system));
  }
}

/*
 * A world's writes go to the server and come back: nothing the HUD writes is readable off the actor
 * until the update returns and `updateActor` fires. The harness's land the instant they are made,
 * which hides every bug living in that gap, so `?delay_writes=true` opens the gap back up. Applied
 * after the picks above so the strip still starts full.
 */
const ROUND_TRIP = 400;

function delayWrites(member: HarnessActor): void {
  const write = member.setFlag;
  if (!write) return;

  member.setFlag = async (scope: string, key: string, value: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, ROUND_TRIP));
    return write.call(member, scope, key, value);
  };
}

if (flag("delay_writes")) {
  for (const member of Object.values(CAST)) delayWrites(member);
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

const registered = new Map<string, { onChange?: (value: unknown) => void }>();
const written = new Map<string, unknown>();

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
    // The HUD reads its own settings off the client, and every one of them is named `hud_<key>`
    // here, so `?hud_hotbar=both` is the setting being set exactly as a world would set it. The
    // strip writes some of them itself -- minimizing does -- so a write lands in `written` and
    // runs the setting's `onChange`, as Foundry's client settings do.
    settings: {
      register: (_module: string, key: string, config: { onChange?: (value: unknown) => void }) =>
        registered.set(key, config),
      get: (_module: string, key: string) =>
        written.has(key) ? written.get(key) : params.get(`hud_${key}`),
      set: async (_module: string, key: string, value: unknown) => {
        written.set(key, value);
        registered.get(key)?.onChange?.(value);
        return value;
      },
    },
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

registerSettings();

/*
 * A stand-in for Foundry's canvas, so a screenshot shows the strip against something like the
 * ground it is read on. It follows the theme for that reason: a light strip on a dark ground says
 * nothing about whether light mode works.
 */
const CANVAS = {
  dark: { ground: "#1b1c20", grid: "rgba(255,255,255,.022)" },
  light: { ground: "#cfcabd", grid: "rgba(0,0,0,.035)" },
}[resolveHudTheme(params.get("hud_theme"))];

document.body.style.cssText =
  "margin:0;box-sizing:border-box;min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;" +
  `background:${CANVAS.ground};background-image:linear-gradient(${CANVAS.grid} 1px,transparent 1px),` +
  `linear-gradient(90deg,${CANVAS.grid} 1px,transparent 1px);background-size:46px 46px;padding:26px 20px 20px`;

const host = document.createElement("div");
host.id = "gurps-hud-persistent";
host.className = "gurps-hud gurps-hud-persistent";
document.body.append(host);

mount(PersistentHud, { target: host });

/*
 * A stand-in for the Game Aid's modifier bucket, which `PersistentHudApp#adoptBucket` moves inside
 * the HUD element so it sits beside the strip. Its size is the point: it is Foundry's furniture, so
 * the HUD's own size setting has to stop at the strip's edge rather than run through it.
 */
if (flag("show_bucket")) {
  const bucket = document.createElement("div");
  bucket.id = "bucket-container";
  bucket.textContent = "+0";
  bucket.style.cssText =
    "width:120px;height:60px;display:grid;place-items:center;border-radius:6px;" +
    "border:1px solid #b04a3a;background:#16171b;color:#e8e6e1;font:600 22px system-ui";
  host.append(bucket);
}

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
