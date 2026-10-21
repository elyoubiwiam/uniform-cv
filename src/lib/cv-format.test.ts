import { describe, expect, it } from "vitest";
import { parseFormatting, stripFormatting, toggleMark } from "./cv-format";

describe("inline formatting", () => {
  it("parses bold, italic and underline", () => {
    expect(parseFormatting("a **b** *c* __d__")).toEqual([
      { text: "a " }, { text: "b", bold: true }, { text: " " }, { text: "c", italic: true }, { text: " " }, { text: "d", underline: true },
    ]);
  });
  it("leaves a lone asterisk as text", () => {
    expect(stripFormatting("5* hotel")).toBe("5* hotel");
  });
  it("wraps and unwraps a selection", () => {
    const on = toggleMark("Led team", 4, 8, "bold");
    expect(on.value).toBe("Led **team**");
    expect(toggleMark(on.value, on.start, on.end, "bold").value).toBe("Led team");
  });
});
