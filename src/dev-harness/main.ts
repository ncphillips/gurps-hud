/*
 * Visual harness for the HUD. Mounts the real components against stub Foundry globals so the design
 * can be checked -- and measured against design-handoff/ -- without launching Foundry.
 *
 *   npm run harness   ->  http://localhost:30099/modules/gurps-hud/dev-harness/index.html
 *
 * Query parameters:
 *   ?panel=attrs|maneuver   opens that hover panel on load, so it can be screenshotted
 *   ?maneuver=<id>          puts the actor in combat performing that maneuver
 *   ?measure                appends a <pre id="measurements"> of key bounding boxes
 */
import "@/styles/gurps-hud.css";
import { mount } from "svelte";
import PersistentHud from "@/apps/persistent-hud/PersistentHud.svelte";

const LABELS: Record<string, string> = {
  "GURPS.status.Standing": "Standing",
  "GURPS.maneuverAllOutAttackDetermined": "All-out Attack (Determined)",
};

const harnessParams = new URLSearchParams(location.search);
const maneuver = harnessParams.get("maneuver");

/** Brent Mitton, the character the design mock is drawn from. */
const actor = {
  name: "Brent Mitton",
  img: null,
  statuses: [] as string[],
  system: {
    attributes: {
      ST: { value: 9 },
      DX: { value: 10 },
      IQ: { value: 12 },
      HT: { value: 11 },
      WILL: { value: 12 },
      PER: { value: 12 },
      QN: { value: 10 },
    },
    HP: { value: 20, max: 22 },
    FP: { value: 11, max: 11 },
    thrust: "1d−2",
    swing: "1d−1",
    basicspeed: { value: "5.25" },
    basicmove: { value: "5" },
    frightcheck: 12,
    vision: 12,
    hearing: 12,
    tastesmell: 12,
    touch: 12,
    currentmove: 5,
    currentdodge: 8,
    conditions: {
      posture: "standing",
      maneuver: maneuver ?? "undefined",
      reeling: false,
      exhausted: false,
    },
    encumbrance: { "00000": { key: "enc0", level: 0, current: true } },
    equipment: { carried: { "00000": { name: "Spear", equipped: true } }, other: {} },
    melee: {
      "00000": {
        name: "Spear",
        mode: "Thrust",
        level: 5,
        damage: "1d+1 imp",
        reach: "1–2",
        parry: "5",
        block: "",
      },
      "00001": { name: "Punch", level: 10, damage: "1d−3 cr", reach: "C", parry: "8", block: "" },
      "00002": { name: "Kick", level: 8, damage: "1d−2 cr", reach: "C,1", parry: "", block: "" },
    },
    skills: Object.fromEntries(
      [
        ["Spear", 5, "DX-5"],
        ["Brawling", 10, "DX"],
        ["Stealth", 9, "DX-1"],
        ["First Aid", 12, "IQ"],
        ["Survival (Woodlands)", 11, "Per-1"],
        ["Climbing", 9, "DX-1"],
        ["Knife", 10, "DX"],
        ["Area Knowledge (Home)", 13, "IQ+1"],
        ["Carousing", 11, "HT"],
        ["Scrounging", 12, "Per"],
        ["Swimming", 11, "HT"],
        ["Throwing", 6, "DX-4"],
      ].map(([name, level, relativelevel], index) => [
        String(index).padStart(5, "0"),
        { name, level, relativelevel },
      ]),
    ),
    ranged: {
      "00000": {
        name: "Spear",
        mode: "Thrown",
        level: 6,
        damage: "1d+1 imp",
        acc: "2",
        range: "9/13",
        rof: "1",
      },
    },
  },
};

Object.assign(globalThis, {
  GURPS: {
    LastActor: actor,
    executeOTF: async () => true,
    Maneuvers: {
      getManeuver: (id?: string) =>
        id === "aoa_determined" ? { label: "GURPS.maneuverAllOutAttackDetermined" } : undefined,
    },
  },
  Hooks: { on: () => 0, off: () => undefined },
  canvas: { tokens: { controlled: [] } },
  ui: { hotbar: { page: 1 } },
  game: {
    // A maneuver on the actor implies it is in the active combat, which is what enables the pill.
    combats: { active: maneuver ? { combatants: [{ actor }] } : null },
    i18n: { localize: (key: string) => LABELS[key] ?? key },
    user: {
      getHotbarMacros: () =>
        Array.from({ length: 10 }, (_, index) => ({
          slot: index + 1,
          macro:
            index < 3 ? { name: `Macro ${index + 1}`, img: null, execute: () => undefined } : null,
        })),
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

const params = harnessParams;

setTimeout(() => {
  const panel = params.get("panel");
  if (!panel) return;

  host
    .querySelector<HTMLElement>(`[data-hud-trigger="${panel}"]`)
    ?.dispatchEvent(new MouseEvent("mouseenter"));
}, 300);

setTimeout(() => {
  if (!params.has("measure")) return;

  const bar = host.firstElementChild;
  const row = [...host.querySelectorAll("div")].find((el) =>
    el.textContent?.startsWith("Spear · Thrust"),
  );
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
