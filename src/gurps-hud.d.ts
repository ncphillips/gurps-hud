import type { AttackPicks } from "./gurps/attack-picks";
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
    }
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
