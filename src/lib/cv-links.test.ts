import { describe, expect, it } from "vitest";
import { headerLinks } from "./cv-export";
import { cvSchema, defaultTemplate } from "./cv-schema";
import { hasCompleteTextLayer } from "./pdf-text";

const cv = cvSchema.parse({ fullName: "Jane Doe", headline: null, location: null, email: null, phone: null, links: [], summary: null, experience: [], education: [], skills: [], languages: [], certifications: [], hyperlinks: [{ text: "Portfolio", url: "https://example.com/work" }] });

describe("Candidate header links", () => {
  it("retains a titled link even when its title appears nowhere in the CV body", () => {
    expect(headerLinks(cv, defaultTemplate)).toEqual([{ text: "Portfolio", url: "https://example.com/work" }]);
  });
  it("hides personal header links when anonymising", () => {
    expect(headerLinks(cv, { ...defaultTemplate, anonymise: true })).toEqual([]);
  });
  it("hides header links with contact details", () => {
    expect(headerLinks(cv, { ...defaultTemplate, hideContactDetails: true })).toEqual([]);
  });
});

describe("PDF text fast path", () => {
  it("falls back to the original PDF if even one page has no text layer", () => {
    expect(hasCompleteTextLayer(["Original candidate experience. ".repeat(10), ""])).toBe(false);
  });
  it("uses text only when every page has readable content", () => {
    expect(hasCompleteTextLayer(["Original candidate experience. ".repeat(10), "Original education details. ".repeat(10)])).toBe(true);
  });
});