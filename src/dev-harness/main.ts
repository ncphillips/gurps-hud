/*
 * Visual harness for the HUD. Mounts the real components against stub Foundry globals so the design
 * can be checked -- and measured against design-handoff/ -- without launching Foundry.
 *
 *   npm run harness   ->  http://localhost:30099/modules/gurps-hud/dev-harness/index.html
 *
 * Query parameters:
 *   ?panel=attrs|maneuver|actor   opens that hover panel on load, so it can be screenshotted
 *   ?target                 targets a goblin, so the TARGET pill lists its hit locations
 *   ?maneuver=<id>          puts the actor in combat performing that maneuver
 *   ?edit=hp|fp             opens that pool's box for editing on load
 *   ?measure                appends a <pre id="measurements"> of key bounding boxes
 */
import "@/styles/gurps-hud.css";
import { mount } from "svelte";
import PersistentHud from "@/apps/persistent-hud/PersistentHud.svelte";

const LABELS: Record<string, string> = {
  "GURPS.status.Standing": "Standing",
  "GURPS.status.Crouch": "Crouching",
  "GURPS.status.Kneel": "Kneeling",
  "GURPS.status.Sit": "Sitting",
  "GURPS.status.Crawling": "Crawling",
  "GURPS.status.Prone": "Prone",
  "GURPS.maneuverCommittedAttack": "Committed Attack",
};

const harnessParams = new URLSearchParams(location.search);

/** Hooks registered by the HUD, so the harness's fake actor can trigger a rerender. */
const hooks = new Map<string, Array<() => void>>();
const maneuver = harnessParams.get("maneuver");

/** Brent Mitton, the character the design mock is drawn from. */
const actor = {
  /** Mimics Document#update closely enough for the HP/FP boxes: flatten the key path and rerender. */
  async update(changes: Record<string, unknown>) {
    for (const [path, value] of Object.entries(changes)) {
      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let target: any = actor;
      for (const key of keys.slice(0, -1)) target = target[key];
      target[keys[keys.length - 1]] = value;
    }
    for (const hook of hooks.get("updateActor") ?? []) hook();
  },
  name: "Brent Mitton",
  img: null,
  sheet: { render: () => console.log("harness: open character sheet") },
  async replacePosture(id: string) {
    actor.system.conditions.posture = id;
    for (const hook of hooks.get("updateActor") ?? []) hook();
  },
  async replaceManeuver(id: string) {
    actor.system.conditions.maneuver = id;
    for (const hook of hooks.get("updateActor") ?? []) hook();
  },
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
    hitlocations: Object.fromEntries(
      [
        ["Eye", "-9", "0", "-"],
        ["Skull", "-7", "2", "3-4"],
        ["Face", "-5", "0", "5"],
        ["Right Leg", "-2", "1", "6-7"],
        ["Right Arm", "-2", "1", "8"],
        ["Torso", "0", "1", "9-10"],
        ["Groin", "-3", "1", "11"],
        ["Left Arm", "-2", "1", "12"],
        ["Left Leg", "-2", "1", "13-14"],
        ["Hand", "-4", "0", "15"],
        ["Foot", "-4", "0", "16"],
        ["Neck", "-5", "0", "17-18"],
        ["Vitals", "-3", "1", "-"],
      ].map(([where, penalty, dr, roll], index) => [
        String(index).padStart(5, "0"),
        { where, penalty, dr, roll },
      ]),
    ),
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

/** Something for Brent to aim at, with a body plan of its own so the table visibly isn't his. */
const goblin = {
  name: "Goblin Grunt",
  system: {
    hitlocations: Object.fromEntries(
      [
        ["Eye", "-9", "0", "-"],
        ["Skull", "-7", "2", "3-4"],
        ["Face", "-5", "0", "5"],
        ["Torso", "0", "0", "9-11"],
        ["Groin", "-3", "0", "12"],
        ["Arm", "-2", "0", "13-14"],
        ["Leg", "-2", "0", "15-16"],
        ["Neck", "-5", "0", "17"],
        ["Vitals", "-3", "0", "18"],
      ].map(([where, penalty, dr, roll], index) => [
        String(index).padStart(5, "0"),
        { where, penalty, dr, roll },
      ]),
    ),
  },
};

/** The tokens on the harness's scene, so the name menu has something to switch between. */
const tokens = [
  {
    id: "t-brent",
    name: "Brent Mitton",
    document: { texture: { src: null } },
    actor,
    isOwner: true,
  },
  {
    id: "t-goblin",
    name: "Goblin Grunt",
    document: { texture: { src: null } },
    actor: goblin,
    isOwner: true,
  },
  {
    id: "t-dragon",
    name: "Dragon",
    document: { texture: { src: null } },
    actor: { name: "Dragon" },
    isOwner: false,
  },
];

/** Mutable so the harness can demonstrate assigning, reordering and removing macros. */
const hotbar: (string | null)[] = Array.from({ length: 10 }, (_, index) =>
  index < 3 ? `Macro ${index + 1}` : null,
);

Object.assign(globalThis, {
  GURPS: {
    LastActor: actor,
    SetLastActor: (next: unknown) => {
      (globalThis as { GURPS: { LastActor: unknown } }).GURPS.LastActor = next;
      for (const hook of hooks.get("updateLastActorGURPS") ?? []) hook();
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
  Hooks: {
    on: (name: string, fn: () => void) => hooks.set(name, [...(hooks.get(name) ?? []), fn]),
    off: () => undefined,
  },
  canvas: {
    tokens: {
      controlled: [],
      placeables: tokens,
      get: (id: string) => tokens.find((token) => token.id === id),
    },
  },
  ui: { hotbar: { page: 1 } },
  game: {
    // A maneuver on the actor implies it is in the active combat, which is what enables the pill.
    combats: { active: maneuver ? { combatants: [{ actor }] } : null },
    i18n: { localize: (key: string) => LABELS[key] ?? key },
    user: {
      // Foundry's `UserTargets` is a Set of tokens; the HUD only ever asks it for the first one.
      targets: { first: () => (harnessParams.has("target") ? { actor: goblin } : undefined) },
      getHotbarMacros: () =>
        hotbar.map((name, index) => ({
          slot: index + 1,
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
        for (const hook of hooks.get("updateUser") ?? []) hook();
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

const params = harnessParams;

setTimeout(() => {
  const panel = params.get("panel");
  if (!panel) return;

  host
    .querySelector<HTMLElement>(`[data-hud-trigger="${panel}"]`)
    ?.dispatchEvent(new MouseEvent("mouseenter"));
}, 300);

setTimeout(() => {
  const pool = params.get("edit");
  if (!pool) return;

  const needle = pool === "fp" ? "Fatigue" : "Hit Points";
  [...host.querySelectorAll<HTMLButtonElement>("button[title]")]
    .find((el) => el.title.startsWith(needle))
    ?.click();
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
