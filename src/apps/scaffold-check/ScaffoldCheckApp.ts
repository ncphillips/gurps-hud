import { SvelteApp } from "@/apps/SvelteApp";
import ScaffoldCheck from "./ScaffoldCheck.svelte";

/** Throwaway smoke test proving the Svelte/Tailwind/AppV2 pipeline works. Delete once real HUDs land. */
export class ScaffoldCheckApp extends SvelteApp {
  static override DEFAULT_OPTIONS = {
    id: "gurps-hud-scaffold-check",
    classes: ["gurps-hud", "gurps-hud-scaffold-check"],
    window: {
      title: "GURPS HUD",
      frame: true,
      positioned: true,
      resizable: true,
      minimizable: true,
    },
    position: { width: 320, height: 180 },
  };

  component = () => ScaffoldCheck;
  props = () => ({ version: game.modules?.get("gurps-hud")?.version ?? "dev" });
}
