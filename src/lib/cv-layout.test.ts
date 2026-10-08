import { describe, expect, it } from "vitest";
import { cvParagraphs } from "./cv-layout";

describe("CV paragraph preservation", () => {
  it("keeps distinct paragraphs rather than merging their words", () => {
    expect(cvParagraphs("First paragraph.\r\n \r\nSecond paragraph."))
      .toEqual(["First paragraph.", "Second paragraph."]);
  });
  it("removes redundant spaces without rewriting terms or guessing missing word boundaries", () => {
    expect(cvParagraphs("Work  with ONG .\n\nUse .NET and teamwork."))
      .toEqual(["Work with ONG.", "Use .NET and teamwork."]);
  });
  it("preserves a line break within a paragraph", () => {
    expect(cvParagraphs("First line\n• Second line")) .toEqual(["First line\n• Second line"]);
  });
});