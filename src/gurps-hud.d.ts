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
    }
  }

  // Module flags go here as features land, e.g.:
  // interface FlagConfig {
  //   Actor: { "gurps-hud"?: { pinned?: boolean } };
  // }
}
