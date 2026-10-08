import { describe, expect, it } from "vitest";
import { reflow } from "./reflow";

describe("reflow", () => {
  it("joins wrapped lines into one paragraph", () => {
    expect(reflow("Experienced engineer with\n10 years in fintech\nand payments.")).toBe(
      "Experienced engineer with 10 years in fintech and payments.",
    );
  });
  it("keeps real paragraph breaks", () => {
    expect(reflow("First para\nwrapped.\n\nSecond para.")).toBe("First para wrapped.\n\nSecond para.");
  });
  it("rejoins hyphenated words split across lines", () => {
    expect(reflow("strong commu-\nnication skills")).toBe("strong communication skills");
  });
});
