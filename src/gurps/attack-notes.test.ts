import { describe, expect, it, test } from "vitest";
import { noteSegments } from "./attack-notes";

describe("noteSegments", () => {
  it("keeps plain notes as a single run of text", () => {
    expect(noteSegments("Swing to the left")).toEqual([{ text: "Swing to the left" }]);
  });

  it("turns a link the Game Aid rendered into a clickable OtF", () => {
    expect(
      noteSegments(`<span class='gga-app gurpslink' data-otf='/anim slash'>Swing!</span>`),
    ).toEqual([{ text: "Swing!", otf: "/anim slash" }]);
  });

  it("keeps the text either side of a link in order", () => {
    expect(
      noteSegments(`Hits hard <span class='gurpslink' data-otf='/fp -1'>Tire</span> later`),
    ).toEqual([{ text: "Hits hard " }, { text: "Tire", otf: "/fp -1" }, { text: " later" }]);
  });

  test("a link with markup inside it", () => {
    expect(
      noteSegments(`<span class='gurpslink' data-otf='ST'><b>ST</b> check</span>`),
    ).toEqual([{ text: "ST check", otf: "ST" }]);
  });

  test("a modifier the Game Aid rendered", () => {
    expect(
      noteSegments(`<span class='gga-app glinkmodplus' data-otf='+2 aim'>+2 aim</span>`),
    ).toEqual([{ text: "+2 aim", otf: "+2 aim" }]);
  });

  test("markup that is not a link", () => {
    expect(noteSegments("one<br>two <i>three</i>")).toEqual([{ text: "onetwo three" }]);
  });

  test("empty notes", () => {
    expect(noteSegments("")).toEqual([]);
  });
});
