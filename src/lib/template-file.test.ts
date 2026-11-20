import { describe, expect, it } from "vitest";
import { defaultTemplate } from "./cv-schema";
import { parseTemplateFile, templateFileContents } from "./template-file";

describe("Template file", () => {
  it("round-trips a template", () => {
    const template = { ...defaultTemplate, agencyName: "Northbridge", accentColor: "#112233", font: "times" as const, anonymise: true };
    expect(parseTemplateFile(templateFileContents(template))).toEqual(template);
  });
  it("rejects text that is not a Uniform template", () => {
    expect(parseTemplateFile("not json")).toBeNull();
    expect(parseTemplateFile("[]")).toBeNull();
    expect(parseTemplateFile(JSON.stringify({ agencyName: "No marker" }))).toBeNull();
  });
  it("ignores unknown, wrongly typed and unsafe values", () => {
    const parsed = parseTemplateFile(JSON.stringify({ uniformTemplate: 1, agencyName: 5, accentColor: "red", font: "comic", logoDataUrl: "https://example.com/x.png", extra: "x" }));
    expect(parsed).toEqual(defaultTemplate);
  });
  it("always loads as a recruiter template", () => {
    expect(parseTemplateFile(JSON.stringify({ uniformTemplate: 1, audience: "candidate" }))?.audience).toBe("recruiter");
  });
});
