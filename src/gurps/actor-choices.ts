import type { GurpsActorLike } from "./system-types";

/** The slice of a canvas token the switcher needs; structural so it can be built without Foundry. */
export interface TokenLike {
  /** Null only for a token not yet placed, which the canvas never lists. */
  id: string | null;
  name: string;
  img?: string | null;
  actor: GurpsActorLike | null;
  /** Whether this user may control the token -- true for every token when the user is a GM. */
  isOwner: boolean;
}

export interface ActorChoice {
  /** The token's id, which is also how the choice is handed back to the Game Aid. */
  key: string;
  name: string;
  img: string | null;
  actor: GurpsActorLike;
}

/**
 * The actors the strip can be switched to without selecting a token: one per controllable token on
 * the canvas. Several tokens of a linked actor collapse to one choice -- they are the same document
 * -- while unlinked tokens each carry their own synthetic actor and so stay separate.
 */
export function actorChoices(tokens: TokenLike[]): ActorChoice[] {
  const seen = new Set<GurpsActorLike>();
  const choices: ActorChoice[] = [];

  for (const token of tokens) {
    if (!token.actor || !token.isOwner || seen.has(token.actor)) continue;
    seen.add(token.actor);
    choices.push({
      key: token.id ?? token.name,
      name: token.name,
      img: token.img ?? token.actor.img ?? null,
      actor: token.actor,
    });
  }

  return choices.sort((a, b) => a.name.localeCompare(b.name));
}
