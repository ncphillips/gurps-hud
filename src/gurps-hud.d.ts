import type { AttackPicks } from "./gurps/attack-picks";
import type { HotbarMode, HudTheme } from "./settings";
import type { GurpsActorLike } from "./gurps/system-types";

export {};

declare module "fvtt-types/configuration" {
  namespace Hooks {
    interface HookConfig {
      /**
       * Fired by the GURPS 4e Game Aid whenever its notion of the "current" actor changes -- token
       * selection, sheet focus, or an explicit `GURPS.SetLastActor`. The persistent HUD follows it.
       */
      updateLastActorGURPS: (actor: GurpsActorLike | null) => void;
      /** Foundry's per-class render hook for the Game Aid's `ModifierBucket` application. */
      renderModifierBucket: (app: object, html: unknown, data: object) => void;
      /**
       * Fired by `registerSettings` when the reader changes which macro bar they want. Foundry
       * announces a world setting through `updateSetting` and a client one not at all, so this is
       * how the strip's footer and the modifier bucket hear about it without a reload.
       */
      "gurps-hud.hotbarMode": (mode: HotbarMode) => void;
    }
  }

  interface SettingConfig {
    /**
     * How large the strip is drawn, as a multiple of the size it was designed at. Client-scoped:
     * it is a fact about the screen the HUD is read on, not about the world.
     */
    "gurps-hud.scale": number;
    /**
     * Which palette the strip is drawn in. Client-scoped for the same reason as the scale: which
     * one reads well is a fact about the room and the screen, not about the world.
     */
    "gurps-hud.theme": HudTheme;
    /**
     * Whose macro bar is on screen -- the strip's own footer, Foundry's hotbar, or both.
     * Client-scoped: it is a fact about how one person plays, not about the world.
     */
    "gurps-hud.hotbar": HotbarMode;
  }

  interface FlagConfig {
    Actor: {
      /**
       * Which of the actor's attacks the strip shows, and in what order. It lives on the actor
       * rather than on the user because the choice is about the character -- a GM who curated a
       * dragon's four useful attacks out of its forty wants that curation back the next time
       * anybody selects the dragon, not once per person at the table.
       */
      "gurps-hud"?: { attacks?: AttackPicks };
    };
  }
}
