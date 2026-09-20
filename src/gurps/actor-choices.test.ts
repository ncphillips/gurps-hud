import { describe, expect, it, test } from "vitest";
import { actorChoices } from "./actor-choices";
import type { GurpsActorLike } from "./system-types";

function actor(name: string, img: string | null = null): GurpsActorLike {
  return { id: name, name, img } as GurpsActorLike;
}

describe("actorChoices", () => {
  it("lists one choice per controllable token", () => {
    const choices = actorChoices([
      { id: "t1", name: "Thor", actor: actor("Thor"), isOwner: true },
      { id: "t2", name: "Goblin", actor: actor("Goblin"), isOwner: true },
    ]);
    expect(choices.map((choice) => choice.name)).toEqual(["Goblin", "Thor"]);
  });

  it("names a choice after its token, since that is what the canvas shows", () => {
    const choices = actorChoices([
      { id: "t1", name: "Goblin Grunt 2", actor: actor("Goblin Grunt"), isOwner: true },
    ]);
    expect(choices[0].name).toBe("Goblin Grunt 2");
  });

  it("sorts choices by name", () => {
    const choices = actorChoices([
      { id: "t1", name: "Zed", actor: actor("Zed"), isOwner: true },
      { id: "t2", name: "Abe", actor: actor("Abe"), isOwner: true },
    ]);
    expect(choices.map((choice) => choice.name)).toEqual(["Abe", "Zed"]);
  });

  it("uses the token image over the actor's", () => {
    const choices = actorChoices([
      {
        id: "t1",
        name: "Thor",
        img: "token.png",
        actor: actor("Thor", "actor.png"),
        isOwner: true,
      },
    ]);
    expect(choices[0].img).toBe("token.png");
  });

  test("a token the user cannot control", () => {
    const choices = actorChoices([
      { id: "t1", name: "Thor", actor: actor("Thor"), isOwner: true },
      { id: "t2", name: "Dragon", actor: actor("Dragon"), isOwner: false },
    ]);
    expect(choices.map((choice) => choice.name)).toEqual(["Thor"]);
  });

  test("a token with no actor", () => {
    const choices = actorChoices([{ id: "t1", name: "Marker", actor: null, isOwner: true }]);
    expect(choices).toEqual([]);
  });

  test("two tokens sharing one linked actor", () => {
    const thor = actor("Thor");
    const choices = actorChoices([
      { id: "t1", name: "Thor", actor: thor, isOwner: true },
      { id: "t2", name: "Thor", actor: thor, isOwner: true },
    ]);
    expect(choices).toHaveLength(1);
  });
});
